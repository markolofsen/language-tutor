# Decisions

- **Own app, not a ready-made one.** No existing app or MCP server records errors by category, ties them to the next exercise and serves a phone UI ([research](research/solutions.md), [0003](../@dev/decisions/0003-claude-is-the-tutor-through-mcp.md)).
- **Claude is the tutor, through our MCP server.** It writes stories, judges translations and runs the session; the app stores and practises.
- **No Anki.** FSRS comes from `ts-fsrs`; Anki tools need a desktop Anki and do not fit paragraph translation.
- **Next.js only, SQLite.** One user, one file. Move to Cloudflare D1 + R2 later by swapping the driver ([0001](../@dev/decisions/0001-next-only-with-sqlite.md)).
- **Method** ([research/methods.md](research/methods.md)): paragraph translation both ways as the main block, dictation and shadowing on varied accents, FSRS on cloze cards, every error becomes a drill, no gamification.
- **Thin app (2026-10-20).** Vocabulary and data are managed through MCP in a Claude chat; the phone app keeps only what a chat cannot do (typed paragraph translation, review cards, dictation, voices, a read-only profile).
- **Secrets in the private repository (2026-10-20).** The password, session key and MCP token are committed in the app source; nothing is configured in Docker.
- **OAuth for the connector (2026-10-20).** claude.ai asks for OAuth, so `/mcp` has a stateless OAuth beside the bearer header.
- **Clean dictionary (2026-10-20).** The MCP server carries the word-saving rules and tools to fix or remove words ([research on voice](research/pronunciation.md) is the next idea).
