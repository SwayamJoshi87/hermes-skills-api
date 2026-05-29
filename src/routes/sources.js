const { Router } = require('express');
const h = require('../services/hermesCli');

const router = Router();

/** GET /api/sources — list configured taps */
router.get('/', async (req, res, next) => {
  try {
    const output = await h.listSources();
    res.json({ output });
  } catch (e) { next(e); }
});

/** POST /api/sources — add a GitHub repo as a skill source */
router.post('/', async (req, res, next) => {
  try {
    const { repo } = req.body;
    if (!repo) return res.status(400).json({ error: 'repo is required' });
    const result = await h.addSource(repo);
    res.json(result);
  } catch (e) { next(e); }
});

/** DELETE /api/sources/:name — remove a tap (name from the tap list) */
router.delete('/:name', async (req, res, next) => {
  try {
    const result = await h.removeSource(req.params.name);
    res.json(result);
  } catch (e) { next(e); }
});

module.exports = router;
