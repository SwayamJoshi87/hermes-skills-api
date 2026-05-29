# hermes-skills-api

Standalone REST API for [Hermes Agent](https://github.com/nousresearch/hermes-agent) skills management. Wraps the `hermes skills` CLI into clean JSON endpoints that any frontend can consume.

## Setup

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

Default `3100`. Override with `PORT=4200 npm start`.
