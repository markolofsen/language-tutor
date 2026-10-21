# Contributing

- Open an issue before a large change. Small fixes: a pull request is fine.
- `pnpm check` must pass (lint, type-check, tests). CI also builds the app.
- Code and documents are in English. Read the map and the invariants in [`CLAUDE.md`](CLAUDE.md) first: all data access is async, secrets are environment variables, and the assistant's judgement enters only through the validated MCP tools.
- A change to the tutoring method needs its reasoning in [`@docs/research`](@docs/research/methods.md) or a decision in [`@dev/decisions`](@dev/decisions/README.md).
- Do not commit secrets, a database file or personal learning data.
