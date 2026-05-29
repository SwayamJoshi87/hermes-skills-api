const { execFile } = require('child_process');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const HERMES_BIN = 'hermes';
const SKILLS_DIR = path.join(process.env.HOME || '/home/server', '.hermes', 'skills');
const EXEC_TIMEOUT = 30000; // 30s

/**
 * Run a hermes CLI command and return parsed stdout/stderr.
 * @param {string[]} args
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function hermes(args) {
  return new Promise((resolve, reject) => {
    execFile(HERMES_BIN, args, { timeout: EXEC_TIMEOUT, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && !stdout) {
        reject(new Error(stderr || err.message));
      } else {
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      }
    });
  });
}

// ── Skills ────────────────────────────────────────────────────────────────

/** List installed skills via snapshot export */
async function listSkills() {
  const { stdout } = await hermes(['skills', 'snapshot', 'export', '-']);
  return JSON.parse(stdout);
}

/** Search skill registries */
async function searchSkills(query, { source = 'all', limit = 10 } = {}) {
  const args = ['skills', 'search', query, '--json', '--limit', String(limit)];
  if (source !== 'all') args.push('--source', source);
  const { stdout } = await hermes(args);
  return JSON.parse(stdout);
}

/** Browse available skills (paginated) */
async function browseSkills({ page = 1, size = 20, source = 'all' } = {}) {
  const args = ['skills', 'browse', '--page', String(page), '--size', String(size)];
  if (source !== 'all') args.push('--source', source);
  const { stdout } = await hermes(args);
  return stdout; // browse outputs a table — parse below
}

/** Get a single skill's detail by reading its SKILL.md from disk */
async function getSkill(name) {
  const skillPath = findSkillPath(name);
  if (!skillPath) return null;

  const mdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(mdPath)) return null;

  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = parseSkillMd(raw);
  return {
    name,
    path: skillPath,
    category: path.basename(path.dirname(skillPath)),
    ...parsed,
  };
}

/** List files inside a skill directory */
async function listSkillFiles(name) {
  const skillPath = findSkillPath(name);
  if (!skillPath) return null;

  const files = walkDir(skillPath).map(f => ({
    path: path.relative(skillPath, f),
    size: fs.statSync(f).size,
  }));
  return { name, path: skillPath, files };
}

/** Read a specific file from a skill directory (path-relative, e.g. "references/api.md") */
async function getSkillFile(name, filePath) {
  const skillPath = findSkillPath(name);
  if (!skillPath) return null;

  const resolved = path.resolve(skillPath, filePath);
  if (!resolved.startsWith(skillPath)) return null; // path traversal guard

  if (!fs.existsSync(resolved)) return null;
  const ext = path.extname(resolved).toLowerCase();
  const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp3', '.mp4', '.woff', '.ttf', '.ico'].includes(ext);

  return {
    name,
    file: filePath,
    size: fs.statSync(resolved).size,
    content: isBinary ? null : fs.readFileSync(resolved, 'utf8'),
    binary: isBinary,
  };
}

/** Install a skill from an identifier or URL */
async function installSkill(identifier, { category, name: overrideName, force = false, yes = true } = {}) {
  const args = ['skills', 'install', identifier];
  if (category) args.push('--category', category);
  if (overrideName) args.push('--name', overrideName);
  if (force) args.push('--force');
  if (yes) args.push('--yes');
  const { stdout, stderr } = await hermes(args);
  return { success: true, stdout, stderr };
}

/** Uninstall a skill */
async function uninstallSkill(name) {
  const { stdout, stderr } = await hermes(['skills', 'uninstall', name]);
  return { success: true, stdout, stderr };
}

/** Check for skill updates */
async function checkUpdates(name) {
  const args = ['skills', 'check'];
  if (name) args.push(name);
  const { stdout, stderr } = await hermes(args);
  return { stdout, stderr };
}

/** Update skills */
async function updateSkills(name) {
  const args = ['skills', 'update'];
  if (name) args.push(name);
  const { stdout, stderr } = await hermes(args);
  return { stdout, stderr };
}

/** Audit installed skills */
async function auditSkills(name, { deep = false } = {}) {
  const args = ['skills', 'audit'];
  if (deep) args.push('--deep');
  if (name) args.push(name);
  const { stdout, stderr } = await hermes(args);
  return { stdout, stderr };
}

/** Inspect a skill without installing */
async function inspectSkill(identifier) {
  const { stdout } = await hermes(['skills', 'inspect', identifier]);
  return stdout;
}

// ── Sources (Taps) ────────────────────────────────────────────────────────

async function listSources() {
  const { stdout } = await hermes(['skills', 'tap', 'list']);
  return stdout;
}

async function addSource(repo) {
  const { stdout, stderr } = await hermes(['skills', 'tap', 'add', repo]);
  return { success: true, stdout, stderr };
}

async function removeSource(repo) {
  const { stdout, stderr } = await hermes(['skills', 'tap', 'remove', repo]);
  return { success: true, stdout, stderr };
}

// ── Snapshot ──────────────────────────────────────────────────────────────

async function exportSnapshot() {
  const { stdout } = await hermes(['skills', 'snapshot', 'export', '-']);
  return JSON.parse(stdout);
}

async function importSnapshot(data, { force = false } = {}) {
  const tmpFile = `/tmp/hermes-skills-import-${Date.now()}.json`;
  fs.writeFileSync(tmpFile, typeof data === 'string' ? data : JSON.stringify(data));
  try {
    const args = ['skills', 'snapshot', 'import', tmpFile];
    if (force) args.push('--force');
    const { stdout, stderr } = await hermes(args);
    return { success: true, stdout, stderr };
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ── Config ────────────────────────────────────────────────────────────────

async function getConfig() {
  const { stdout } = await hermes(['skills', 'config']);
  return stdout;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Walk a skill directory recursively for all files */
function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

/** Find a skill directory by name — search both ~/.hermes/skills/ and the repo skills/ */
function findSkillPath(name) {
  const searchDirs = [
    SKILLS_DIR,
    path.join(process.cwd(), 'skills'),
    '/home/server/hermes-agent/skills',
  ];

  for (const base of searchDirs) {
    if (!fs.existsSync(base)) continue;
    for (const cat of fs.readdirSync(base, { withFileTypes: true })) {
      if (!cat.isDirectory()) continue;
      const skillDir = path.join(base, cat.name, name);
      if (fs.existsSync(skillDir)) return skillDir;
    }
  }
  return null;
}

/** Parse SKILL.md into { frontmatter, body } */
function parseSkillMd(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: {}, body: raw };

  const frontmatter = yaml.load(fmMatch[1]) || {};
  const body = fmMatch[2].trim();
  return { frontmatter, body };
}

module.exports = {
  listSkills,
  searchSkills,
  browseSkills,
  getSkill,
  listSkillFiles,
  getSkillFile,
  installSkill,
  uninstallSkill,
  checkUpdates,
  updateSkills,
  auditSkills,
  inspectSkill,
  listSources,
  addSource,
  removeSource,
  exportSnapshot,
  importSnapshot,
  getConfig,
};
