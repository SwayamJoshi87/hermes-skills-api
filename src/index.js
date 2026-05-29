const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const skillsRouter = require('./routes/skills');
const sourcesRouter = require('./routes/sources');
const h = require('./services/hermesCli');

const app = express();
const PORT = process.env.PORT || 3100;

// ─── Middleware ────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rate limiting — 60 req/min for mutation endpoints, 120 req/min for reads
const readLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const mutateLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });

// ─── Health ────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ─── Skills routes ─────────────────────────────────────────────────────────

app.use('/api/skills', readLimiter, skillsRouter);

// ─── Sources routes ────────────────────────────────────────────────────────

app.use('/api/sources', readLimiter, sourcesRouter);

// ─── Snapshot routes ───────────────────────────────────────────────────────

app.get('/api/snapshot', async (req, res, next) => {
  try {
    const data = await h.exportSnapshot();
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/snapshot/import', mutateLimiter, async (req, res, next) => {
  try {
    const { data, force } = req.body;
    if (!data) return res.status(400).json({ error: 'data is required' });
    const result = await h.importSnapshot(data, { force });
    res.json(result);
  } catch (e) { next(e); }
});

// ─── Config route ──────────────────────────────────────────────────────────

app.get('/api/config', async (_req, res, next) => {
  try {
    const output = await h.getConfig();
    res.json({ output });
  } catch (e) { next(e); }
});

// ─── Error handler ─────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[hermes-skills-api] Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`hermes-skills-api running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/skills              — list installed skills`);
  console.log(`  GET  /api/skills/:name        — skill detail (SKILL.md)`);
  console.log(`  GET  /api/skills/:name/files  — list files in skill dir`);
  console.log(`  GET  /api/skills/:name/files/*— read a file`);
  console.log(`  POST /api/skills/search       — search registries`);
  console.log(`  POST /api/skills/install      — install a skill`);
  console.log(`  POST /api/skills/inspect      — preview a skill`);
  console.log(`  POST /api/skills/check        — check for updates`);
  console.log(`  POST /api/skills/update       — update skills`);
  console.log(`  GET  /api/skills/:name/audit  — audit a skill`);
  console.log(`  DELETE /api/skills/:name      — uninstall`);
  console.log(`  GET  /api/sources             — list taps`);
  console.log(`  POST /api/sources             — add tap`);
  console.log(`  DELETE /api/sources/:name     — remove tap`);
  console.log(`  GET  /api/snapshot            — export snapshot`);
  console.log(`  POST /api/snapshot/import     — import snapshot`);
  console.log(`  GET  /api/config              — skill config`);
});
