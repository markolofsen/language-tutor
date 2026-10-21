# 0001 — Next.js only, SQLite storage

**ACCEPTED 2026-10-20.** Owner: Mark. Storage and deploy amended by [0004](0004-vercel-libsql-daisyui-open-source.md): libSQL (Turso in production, a local file in development) on Vercel.

## Decision
One Next.js app (App Router, route handlers). Storage is SQLite via Drizzle and `better-sqlite3`, one file on the server. No Django. No Postgres. Anki is not used.

## Why
- One user. Postgres means a second server to run, back up and upgrade; SQLite is one file beside the app.
- The LLM layer is small: one strict schema per call. `django_llm` (`solution/projects/django/modules/django_llm`) shows the pattern — strict `json_schema`, parse-and-repair with one bounded re-ask, model cascade, cost on every call, deterministic enum coercion. We port the pattern, not the code: that module is bound to its host through `_integration.get_api_keys()`.
- End-to-end types: one zod schema drives the LLM contract, the database row and the screen.
- FSRS is a library (`ts-fsrs`); the Anki apps and Anki MCP servers need a running desktop Anki and do not fit the tasks (translation, error categories).

## Constraints that come with SQLite
- Exactly one process writes. No replicas sharing the file.
- The file lives on a local disk, never a network filesystem.
- Backups use Litestream or the SQLite backup API, never a copy of the live file.

## Moving later
The schema is Drizzle SQLite, and Cloudflare D1 is SQLite. Moving to D1 + R2 (audio) swaps the driver and the deploy target, not the model. Check before moving: D1 transaction semantics (attempt + errors must commit together; D1 offers `batch`), the Worker size limit under OpenNext, and the migrations ledger. `projects/cf` in the MLS repo holds only DNS and token roles; it is not a Workers example.

## Move to Django only if
A second user or roles appear, scheduled jobs are needed (daily digest), or an admin UI is wanted without building one. The LLM layer (`src/llm`) and routes move; the screens do not.

## Update 2026-10-20
The app now lives in the web workspace (`frontend/apps/language`) and ships with the web docker group; the SQLite file sits on the external volume `lang_lang-data`, still one writer. Off-site backup is a planned track .
