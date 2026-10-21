# 0004 — Vercel, libSQL, daisyUI: an open-source build

**ACCEPTED 2026-10-21.** Owner: Mark. Amends [0001](0001-next-only-with-sqlite.md) (storage and deploy target).

## Decision
- **Deploy:** Vercel, Git integration, production branch `main`, a preview for every pull request. Config in `vercel.json` (framework, install, build, region). A paid plan: Vercel's Hobby tier is for non-commercial use, and the app is meant to run as a product. Verify the current plan terms before buying.
- **Database:** libSQL, a SQLite fork. Production: Turso from the Vercel Marketplace (billed through Vercel). Development and tests: a local `file:` URL, migrated on first use, no server to install. Same Drizzle SQLite schema and the same migrations.
- **UI:** daisyUI 5 (a Tailwind plugin of CSS classes) with three small wrappers in `src/ui/`. Django CFG UI and i18n are gone.
- **Configuration:** the password, session key and `/mcp` token come from environment variables ([`.env.example`](../../.env.example)), no longer from the source. This reverses the 2026-10-20 choice to commit them, which was right for a private repo and is wrong for a public one.
- **Open source:** MIT (proposed; the owner confirms), published as a clean snapshot without this history (the history holds the old secrets), with the personal learner documents left out.

## Why
- A serverless function has no durable disk: a SQLite file cannot live on Vercel. Of the hosted options, libSQL keeps the schema, the migrations and the FSRS data as they are, and a contributor runs the app against a local file. Postgres (Neon, Supabase) would mean a dialect rewrite and a database server for every contributor. Vercel's own Postgres product no longer exists (its databases moved to Neon, see [alternatives](https://nearbase.dev/blog/vercel-postgres-alternatives/)), and Turso is a Marketplace integration billed through Vercel ([Vercel docs](https://docs.vercel.com/marketplace/tursocloud)). Third-party pages put Turso's paid plan at about $5 a month; prices change, check them before relying on a figure.
- daisyUI is CSS only: no runtime, no peer-dependency chain, themes and dark mode by a plugin option, and the app needs buttons, badges, inputs and an empty state, nothing interactive. shadcn/ui would add Radix and copied component source for components this app does not use ([daisyUI's own comparison](https://daisyui.com/compare/daisyui-vs-shadcn/) is vendor-written; the fit here is the reason, not the download counts).
- Environment variables are what Vercel and every contributor expect; a public repo cannot hold secrets.

## What it cost
- Every query is async (a network call to a remote database). Transactions are interactive (`db.transaction(async …)`); the learner context reads its tables in parallel.
- Migrations of a remote database run at build time (`pnpm db:migrate` in `vercel.json`), never from a request. Preview deployments must not share the production database: give `DATABASE_URL` to the Production environment only, or a separate Turso database to Preview.
- The Function region (`sin1`) should be near the Turso location; a far database adds a round trip to every query.

## Still open
- Backups: the Turso plan's restore options (verify); Off-site backup becomes "Turso restore plus a periodic dump".
- Any language, not only English: the prompts, the word rules and the UI copy say English. Not planned in detail yet.
