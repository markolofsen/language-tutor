# Language Tutor

A personal language tutor where **your AI assistant is the teacher**. The app stores your words, schedules reviews and shows the exercises that need a screen; Claude, ChatGPT or Codex talks to it over [MCP](https://modelcontextprotocol.io) and does the teaching: it writes stories from your words, judges your translations, names every mistake and remembers your habits.

> **Status: early.** It runs a real learner's daily practice, but it is a single-user app. Today it teaches English to Russian speakers; other languages are planned, not built.

Today it teaches English to Russian speakers. Other languages are planned.

## How it works
- **You collect words** in any chat ("save these words") or paste a Google Translate export. Each word can carry a memory hook (a sound-alike, a known word or an image) and an example sentence.
- **The assistant writes a story** around your words. You translate it paragraph by paragraph, in both directions.
- **Every mistake is named** by category and by the rule behind it. A mistake that repeats becomes a habit the tutor works on, until you get it right often enough to retire it.
- **Reviews** use the FSRS scheduler ([ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)): cards come back just before you would forget them.
- **The phone app** (a PWA) does what a chat cannot: typed translation, review cards, dictation, voices, a read-only profile.
- The tutoring method and its reasoning live in [`@docs/research`](@docs/research/methods.md); the assistant reads the agreed method from the server, so every assistant teaches the same way.

## Stack
Next.js 16 (App Router), React 19, Tailwind 4 + daisyUI 5, Drizzle ORM on libSQL (SQLite), `@modelcontextprotocol/sdk` (stateless Streamable HTTP), OAuth 2.1 for the assistant connectors, zod, Vitest.

## Run it locally
```bash
pnpm install
cp .env.example .env.local     # set APP_PASSWORD, APP_SECRET, MCP_TOKEN (openssl rand -hex 32)
pnpm dev                       # http://localhost:3000, database file at data/english.db
```
Leave `DATABASE_URL` empty locally: a SQLite file is created and migrated for you.

## Deploy to Vercel
1. Import the repository in Vercel (a paid plan; Hobby is for non-commercial use). `vercel.json` sets the build command and the region.
2. Add a Turso database from the Vercel Marketplace. It sets `DATABASE_URL` and `DATABASE_AUTH_TOKEN`; scope them to the Production environment so previews never touch your data.
3. Set `APP_PASSWORD`, `APP_SECRET` and `MCP_TOKEN` in the Production environment. Set `APP_URL` only for a custom domain.
4. Push to `main`: Vercel builds, runs `pnpm db:migrate` against the database, and deploys.

## Self-host with Docker
`cp .env.example .env`, set `APP_PASSWORD`, `APP_SECRET`, `MCP_TOKEN` and `APP_URL`, then `docker compose up -d`. The SQLite file lives in the `data` volume; run one instance only. Back it up with `sqlite3 /data/english.db ".backup <file>"` inside the container.

## Connect an assistant
Open **Profile → Connect an assistant** in the app. It has the steps for Claude (claude.ai and Claude Code), ChatGPT (custom MCP server, OAuth) and Codex, with copy buttons. Sign-in asks for `APP_PASSWORD` once.

## Configuration
| Variable | Meaning |
|---|---|
| `APP_PASSWORD` | the one sign-in password |
| `APP_SECRET` | signs the session cookie and OAuth codes; changing it signs everyone out |
| `MCP_TOKEN` | the bearer token of `/mcp` |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | libSQL database; empty means a local file |
| `APP_URL` | public origin when it is not the Vercel production domain |

## Development
`pnpm check` runs lint, type-check and the tests (a local libSQL file, no server needed). `pnpm db:generate` after changing `src/db/schema.ts`. The code map and invariants are in [`CLAUDE.md`](CLAUDE.md). See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Limits and security
- **One user, one writer.** One password, one SQLite file, one process that writes. Do not scale it horizontally.
- **Sign-in is rate limited in memory** (5 failed attempts per address and 40 in total per 15 minutes). On a single server that is the limit; on serverless each instance counts alone, so use a long password.
- **Secrets are yours.** Nothing secret ships in the repository; set `APP_PASSWORD`, `APP_SECRET` and `MCP_TOKEN` as long random values. Changing `APP_SECRET` signs every client out.
- **No off-site backup yet.** Back up the database file yourself (a Turso database has its own restore options).
- **English first.** The prompts, word rules and UI copy are English; the learner's language is Russian.
- Found a vulnerability? Open a private security advisory on GitHub rather than a public issue.

## License
[MIT](LICENSE)
