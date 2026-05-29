# hermes-skills-api

Standalone REST API for [Hermes Agent](https://github.com/nousresearch/hermes-agent) skills management. Wraps the `hermes skills` CLI into clean JSON endpoints that any frontend can consume.

## Quick start (Docker)

```bash
git clone https://github.com/SwayamJoshi87/hermes-skills-api.git
cd hermes-skills-api

# Edit docker-compose.yml — point the second volume at YOUR hermes-agent clone
# (see "What the volumes do" below)
docker compose up -d

# Verify
curl http://localhost:3100/api/health
```

Server runs on port 3100.

## What the volumes do

The container needs access to two skill directories. Both must be mounted from the **same machine where Hermes Agent is installed** — the API reads and writes the real skills your `hermes` CLI uses.

| Volume | Path in container | RW? | What it is |
|--------|-------------------|-----|------------|
| **Installed skills** | `/home/node/.hermes/skills` | read-write | Skills you installed via `hermes skills install`. This is `~/.hermes/skills` on your host. Must be writable — install, uninstall, and update endpoints write here. |
| **Built-in skills** | `/opt/hermes-skills` | read-only | The 93+ skills shipped with the hermes-agent repo. Point this at `<your-hermes-agent-clone>/skills`. Optional — if you skip it, only hub-installed skills appear in file lookups. Marketplace search still works either way. |

### Finding the right paths

```bash
# Installed skills — always here:
ls ~/.hermes/skills/

# Built-in skills — wherever you cloned hermes-agent:
find / -maxdepth 3 -name "hermes-agent" -type d 2>/dev/null
# Common locations:
#   /home/server/hermes-agent/skills
#   ~/hermes-agent/skills
```

Edit `docker-compose.yml` and change the second volume path to match your setup.

## Can this run on a different machine?

Yes, but you need the skills directories to be accessible. Options:

1. **Same machine (recommended):** Mount the local paths directly. Zero latency, zero fuss.
2. **NFS share:** Export `~/.hermes/skills/` and the repo `skills/` dir via NFS, mount them on the Docker host.
3. **rsync cron:** Sync the dirs periodically. Installs won't propagate back to the hermes host unless you rsync both ways.
4. **Git-based skills only:** Skip the installed-skills mount and only mount the repo skills. You lose install/uninstall but file lookups against built-in skills work.

Bottom line: the API wraps `hermes skills` CLI plus disk reads. It needs to see the same files `hermes` sees. Run it on the same box unless you've got a specific reason not to.

## Bare-metal setup (no Docker)

```bash
npm install
npm start        # runs on port 3100
npm run dev      # watch mode
```

Requires `hermes` CLI on `$PATH` and `~/.hermes/skills/` on disk.

## Endpoints

### Skills

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/skills` | List installed skills (JSON via snapshot) |
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
