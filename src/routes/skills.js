const { Router } = require('express');
const h = require('../services/hermesCli');

const router = Router();

/**
 * GET /api/skills
 * List installed skills (JSON from snapshot export).
 * Query params: ?source=all|hub|builtin|local (filtered client-side)
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await h.listSkills();
    let skills = data.skills || [];

    if (req.query.source && req.query.source !== 'all') {
      skills = skills.filter(s => s.source === req.query.source);
    }

    res.json({
      hermes_version: data.hermes_version,
      exported_at: data.exported_at,
      count: skills.length,
      skills,
      taps: data.taps || [],
    });
  } catch (e) { next(e); }
});

/**
 * GET /api/skills/all
 * List ALL skills — merges installed (snapshot) + built-in (filesystem scan).
 */
router.get('/all', async (req, res, next) => {
  try {
    const data = await h.listAllSkills();
    res.json(data);
  } catch (e) { next(e); }
});

/**
 * POST /api/skills/search
 * Search skill registries.
 * Body: { query, source?, limit? }
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, source, limit } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const results = await h.searchSkills(query, { source, limit });
    res.json({ count: results.length, results });
  } catch (e) { next(e); }
});

/**
 * GET /api/skills/browse
 * Browse available skills (paginated).
 * Query: ?page=1&size=20&source=all
 */
router.get('/browse', async (req, res, next) => {
  try {
    const { page, size, source } = req.query;
    const output = await h.browseSkills({ page, size, source });
    res.json({ output });
  } catch (e) { next(e); }
});

/**
 * GET /api/skills/:name
 * Get full skill detail — frontmatter + body from SKILL.md.
 */
router.get('/:name', async (req, res, next) => {
  try {
    const skill = await h.getSkill(req.params.name);
    if (!skill) return res.status(404).json({ error: `Skill "${req.params.name}" not found` });
    res.json(skill);
  } catch (e) { next(e); }
});

/**
 * GET /api/skills/:name/files
 * List all files in a skill directory.
 */
router.get('/:name/files', async (req, res, next) => {
  try {
    const data = await h.listSkillFiles(req.params.name);
    if (!data) return res.status(404).json({ error: `Skill "${req.params.name}" not found` });
    res.json(data);
  } catch (e) { next(e); }
});

/**
 * GET /api/skills/:name/files/*
 * Read a specific file inside a skill directory.
 * The wildcard captures the relative path.
 */
router.get('/:name/files/(*)', async (req, res, next) => {
  try {
    const filePath = req.params[0];
    if (!filePath) return res.status(400).json({ error: 'file path required' });

    const data = await h.getSkillFile(req.params.name, filePath);
    if (!data) return res.status(404).json({ error: `File not found: ${filePath}` });

    if (data.binary) {
      return res.json({ name: data.name, file: data.file, size: data.size, binary: true, content: null });
    }

    res.json(data);
  } catch (e) { next(e); }
});

/**
 * POST /api/skills/install
 * Install a skill from an identifier or URL.
 * Body: { identifier, category?, name?, force? }
 */
router.post('/install', async (req, res, next) => {
  try {
    const { identifier, category, name, force } = req.body;
    if (!identifier) return res.status(400).json({ error: 'identifier is required' });

    const result = await h.installSkill(identifier, { category, name: name, force });
    res.json(result);
  } catch (e) { next(e); }
});

/**
 * DELETE /api/skills/:name
 * Uninstall a hub-installed skill.
 */
router.delete('/:name', async (req, res, next) => {
  try {
    const result = await h.uninstallSkill(req.params.name);
    res.json(result);
  } catch (e) { next(e); }
});

/**
 * POST /api/skills/check
 * Check installed hub skills for updates.
 * Body (optional): { name? }
 */
router.post('/check', async (req, res, next) => {
  try {
    const result = await h.checkUpdates(req.body.name);
    res.json(result);
  } catch (e) { next(e); }
});

/**
 * POST /api/skills/update
 * Update installed hub skills.
 * Body (optional): { name? }
 */
router.post('/update', async (req, res, next) => {
  try {
    const result = await h.updateSkills(req.body.name);
    res.json(result);
  } catch (e) { next(e); }
});

/**
 * GET /api/skills/:name/audit
 * Audit a specific skill (or all if name="_all").
 * Query: ?deep=true
 */
router.get('/:name/audit', async (req, res, next) => {
  try {
    const name = req.params.name === '_all' ? undefined : req.params.name;
    const deep = req.query.deep === 'true';
    const result = await h.auditSkills(name, { deep });
    res.json(result);
  } catch (e) { next(e); }
});

/**
 * POST /api/skills/inspect
 * Preview a skill without installing.
 * Body: { identifier }
 */
router.post('/inspect', async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'identifier is required' });
    const output = await h.inspectSkill(identifier);
    res.json({ output });
  } catch (e) { next(e); }
});

module.exports = router;
