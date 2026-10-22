# `language-tutor` — the app

A personal language tutor (English first): libSQL storage, a phone practice UI, and an MCP server that lets Claude be the tutor. Vocabulary and data are managed through MCP in a Claude chat; the app only does what a chat cannot (typed paragraph translation, review cards, dictation, voices, a read-only profile). Board and decisions: [`@dev/`](@dev/README.md). Learner and research: [`@docs/`](@docs/decisions.md). Rules: [`../../@rules/`](../../@rules/CLAUDE.md) (read `general/` before changing code).

## Map
```
app/        routes only: pages, layouts, /mcp, /oauth/*, /.well-known/*, icons, manifest
proxy.ts    single-user cookie gate; login, /mcp, /oauth, /.well-known and static metadata stay public
src/
  domain/   zod contracts shared by MCP tools and screens (categories, evaluation, story, accents, words)
  db/       Drizzle schema + the one libSQL connection (a local file is migrated on first use; a remote one by `pnpm db:migrate`)
  translate/ OpenRouter translator (translate.ts), saving to the dictionary (save.ts), languages and key settings (settings.ts); route /api/translate
  ui/       Button, Badge, Input, Textarea, Empty: thin daisyUI wrappers
  config.ts the environment: password, session key, MCP token, public origin (read when used)
  words/ stories/ practice/ review/ listening/ profile/   one job each, server-only logic
  mcp/      14 tools, the `session` prompt, server instructions, word rules, bearer auth; one McpServer per request
  oauth/    stateless OAuth for the Claude connector: signed client ids, codes and refresh tokens, PKCE, redirect allow-list
  auth/     cookie session
  features/ client components and server actions, by screen (profile has Connect an assistant)
  routes.ts the only place paths are written
```

## MCP surface
`get_learner_context`, `get_profile`, `add_words`, `update_words`, `remove_words`, `list_words`, `set_learning_plan`, `record_chat_sentence` (every judged sentence, errors with a `pattern`, `patterns_held`), `create_story`, `next_exercise`, `list_pending_attempts`, `record_evaluation`, `get_due_cards`, `grade_card`, prompt `session`. The rules for a clean dictionary live once in `src/mcp/word-rules.ts` and are shown in the tool descriptions and the server instructions: base form, correct spelling, one entry per idiom, a short Russian gloss in the sense the learner met (`translation` is only that gloss). The memory hook goes in `association`, an example sentence in `example`; an example makes a cloze card, so the word comes back. The goal and the agreed method (one table format for every assistant) are stored in `settings`, defaults in `src/domain/method.ts`, and served by `get_learner_context`.

## Invariants
- All data access is async (libSQL). A transaction is `db.transaction(async tx => …)`; a query builder must not be returned from an `async` function that awaits nothing (it is thenable and would run early).
- Secrets are environment variables only (`APP_PASSWORD`, `APP_SECRET`, `MCP_TOKEN`, see `.env.example`); nothing secret is committed. Rotate by changing the variable and redeploying (a new `APP_SECRET` signs everyone out).
- Claude's judgement enters only through `record_evaluation`, `record_chat_sentence` and `create_story`; each validates with the zod contracts in `src/domain`.
- `/mcp` accepts the bearer token as a header or through OAuth (the access token is the same bearer). OAuth sign-in asks the password, or skips it when the app session cookie is valid. Nothing is stored: client ids, codes and refresh tokens are signed with `APP_SECRET`.
- UI copy is English; Claude's notes to the learner are Russian.
- Migrations are read from `./drizzle` relative to the working directory (the app's directory).
- Tests import server-only modules: `vitest.config.ts` stubs `server-only`.

## Commands
```bash
pnpm dev                 # http://localhost:3000; copy .env.example to .env.local first
pnpm db:generate         # after editing src/db/schema.ts; commit drizzle/
pnpm db:migrate          # a remote DATABASE_URL (runs at build time on Vercel)
pnpm check               # lint, type-check, tests; run once at the end of a change
```

## Deploy
Vercel, Git integration, production branch `main`; see [0004](@dev/decisions/0004-vercel-libsql-daisyui-open-source.md) and the README. `vercel.json` sets the build (`pnpm db:migrate && pnpm build`) and the region. Give `DATABASE_URL` to the Production environment only.

## Connect an assistant
Profile → Connect an assistant has the steps and copy buttons. All of them sign in through our OAuth (the app password, or one tap while the app session is open):
- claude.ai: Open Claude (prefilled install link), then Connect. Claude Code: `claude mcp add --scope user --transport http english <origin>/mcp --header "Authorization: Bearer <MCP_TOKEN>"`.
- ChatGPT: Plugins → Add → custom MCP server; Name `English`, Server URL `<origin>/mcp`, Authentication OAuth. The redirect allow-list in `src/oauth/client.ts` has `chatgpt.com/connector_platform_oauth_redirect` and `chatgpt.com/connector/oauth/<id>`; authorization responses carry `iss` (RFC 9207), advertised in the metadata.
- Codex: `codex mcp add english --url <origin>/mcp && codex mcp login english` (loopback `/callback`), or `[mcp_servers.english]` with `http_headers` in `~/.codex/config.toml`.
Then say "start my English session" (the `session` prompt does the same).
