# hermes-skills-api

Standalone REST API for [Hermes Agent](https://github.com/nousresearch/hermes-agent) skills management. Wraps the `hermes skills` CLI into clean JSON endpoints that any frontend can consume.

## Quick start (Docker)

```bash
git clone https://github.com/SwayamJoshi87/hermes-skills-api.git
cd hermes-skills-api

# Edit docker-compose.yml — change the second volume path to YOUR hermes-agent clone
docker compose up -d

# Verify
curl http://localhost:3100/api/health
```

Server runs on port 3100.

## Does this update my actual Hermes Agent?

**Yes.** The container mounts your entire `~/.hermes` directory. When you install a skill through the API, the container's `hermes skills install` writes directly to your real `~/.hermes/skills/` — the same directory your actual Hermes Agent reads from. New skills appear immediately. Uninstalls and updates work the same way.

You can verify this yourself:

```bash
# Install a skill via the API
curl -X POST http://localhost:3100/api/skills/install \
  -H 'Content-Type: application/json' \
  -d '{"identifier": "docker-management"}'

# Your real hermes sees it instantly
hermes skills list | grep docker
```

## What the volumes do

| Volume | Path in container | What it shares |
|--------|-------------------|----------------|
| `~/.hermes` | `/home/node/.hermes` | Your **entire** hermes home: config.yaml, .env keys, state.db, logs, AND the skills directory. Everything `hermes skills` touches. |
| `<hermes-agent-repo>/skills` | `/opt/hermes-skills` (read-only) | The 93+ built-in skills shipped with hermes-agent. Lets the API read SKILL.md files for file-lookup endpoints. |

### Why the full `~/.hermes` mount?

Earlier versions mounted only `~/.hermes/skills`. Problem: `hermes skills install` also touches `.hub/` caches, `.usage.json`, and may read your `config.yaml` and `.env` for provider keys when accessing registries. Mounting the entire directory means the container's hermes CLI behaves exactly like your host's — same config, same keys, same state.

### Finding the right paths

```bash
# Your hermes home — almost always ~/.hermes
ls ~/.hermes/

# Your hermes-agent clone — find it:
find / -maxdepth 3 -name "hermes-agent" -type d 2>/dev/null
# Common locations:
#   /home/server/hermes-agent/skills
#   ~/hermes-agent/skills
```

Edit `docker-compose.yml` and change the second volume path to match your setup. Skip the second mount entirely if you don't have a local clone — hub-installed skills still work.

## Can this run on a different machine?

Yes, but you need the `~/.hermes` directory to be accessible. Options:

1. **Same machine (recommended):** Mount local paths. Zero latency, zero fuss.
2. **NFS share:** Export `~/.hermes/` via NFS, mount it on the Docker host.
3. **rsync cron:** Sync the dirs periodically. Installs won't propagate back unless you rsync both ways.
4. **Read-only mode:** Mount `~/.hermes:ro`. You can browse and search but can't install/uninstall.

Bottom line: the container's `hermes` is a real hermes install. It needs the same files your host `hermes` uses. Run it on the same box.

## Bare-metal setup (no Docker)

```bash
npm install
npm start        # runs on port 3100
npm run dev      # watch mode
```

Requires `hermes` CLI on `$PATH` and `~/.hermes/` on disk.

## Endpoints

### Skills

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/skills` | List installed skills (JSON via snapshot) |
| GET | `/api/skills/all` | List ALL skills — installed + built-in (merged, deduplicated) |
| GET | `/api/skills/:name` | Full skill detail — YAML frontmatter + markdown body |
| GET | `/api/skills/:name/files` | List all files in a skill directory |
| GET | `/api/skills/:name/files/*` | Read a specific file (e.g. `references/api.md`) |
| POST | `/api/skills/search` | Search registries `{ "query": "github", "source": "all", "limit": 5 }` |
| POST | `/api/skills/install` | Install `{ "identifier": "openai/skills/skill-creator" }` |
| POST | `/api/skills/inspect` | Preview `{ "identifier": "..." }` |
| POST | `/api/skills/check` | Check for updates `{ "name": "..." }` (optional) |
| POST | `/api/skills/update` | Update skills `{ "name": "..." }` (optional) |
| GET | `/api/skills/:name/audit` | Audit a skill `?deep=true` |
| DELETE | `/api/skills/:name` | Uninstall a hub-installed skill |

### Sources & Config

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sources` | List configured taps |
| POST | `/api/sources` | Add a tap `{ "repo": "user/repo" }` |
| DELETE | `/api/sources/:name` | Remove a tap |
| GET | `/api/snapshot` | Export full snapshot JSON |
| POST | `/api/snapshot/import` | Import snapshot `{ "data": {...}, "force": false }` |
| GET | `/api/config` | Skill configuration status |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | `{ status, timestamp, uptime }` |

## Port

Default `3100`. Override with `PORT=4200` in the environment or compose file.
