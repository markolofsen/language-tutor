# 0003 — Claude is the tutor, through our own MCP server

**ACCEPTED 2026-10-20.** Owner: Mark. Supersedes the "LLM layer in the app" parts of 0001/0002.

## Decision
The app is storage + a practice UI for the phone + an MCP server. Claude (Claude Code, Claude desktop, Claude mobile) does the intelligent work through MCP tools: it writes stories from the learner's words, judges translations, names every error by category, and guides the session. The app calls no LLM for judging or generation.

## Why
- Claude judges grammar and register better than any cheap model behind a strict schema, and the learner already talks to it.
- Removes the model cascade, repair loop, cost ceiling and API keys from the app. Less to build, nothing to keep in sync.
- Voice conversation with Claude (the Claude apps have a voice mode, [beta](https://support.claude.com/en/articles/11101966-use-voice-mode)) is meant to cover speaking and listening practice without an STT pipeline in a PWA. Not verified: whether our custom connector works inside voice mode; the help page names only built-in connectors. Check on the phone before relying on it (iOS PWA microphone support is unreliable).

## Ready-made MCP servers checked 2026-10-20
| Server | Gives | Misses |
|---|---|---|
| [zcsabbagh/flashcards-mcp](https://github.com/zcsabbagh/flashcards-mcp) | FSRS-5, SQLite, 14 tools, ElevenLabs TTS, MIT | no language model, no errors, no paragraph exercises, local only |
| [DuongNAD/vega-mcp](https://github.com/DuongNAD/vega-mcp) | `ts-fsrs`, error log → cards through an inbox, MIT | files not SQLite, general study, no phone UI |
| [code-byte404/vocab-mcp](https://github.com/code-byte404/vocab-mcp) | word saving, batch, gTTS, SQLite, MIT | SM-2 not FSRS, single words only |
| [jorgetrad99/english-tutor-mcp](https://github.com/jorgetrad99/english-tutor-mcp) | remote server, diagnostic level, session history | tools, storage and licence not stated; Spanish-speaking audience |
| Anki MCP servers | see `research/solutions.md` | need desktop Anki |

All have 0–4 stars and a handful of commits. None records errors by category, none ties error history to the next exercise, none serves a phone UI. We write our own and take their shapes: `flashcards-mcp` for the card tools, `vega-mcp` for errors becoming cards and for a `guide` tool, `vocab-mcp` for batch word saving.

## Shape
- MCP over Streamable HTTP at `/mcp`, in the same Next.js process, so SQLite has one writer. Bearer token. Claude Code connects with a header. claude.ai demanded OAuth, so `/mcp` also speaks a small stateless OAuth (dynamic registration, PKCE, password consent) whose access token is the same bearer ([claude-connects-with-one-click](../completed/claude-connects-with-one-click/PLAN.md)). Settled 2026-10-20.
- Tools take the zod contracts of 0002; Claude cannot write a malformed evaluation.
- The server `instructions` and a `session` prompt carry the method from `research/methods.md`, so any Claude client behaves as the same tutor.
- The phone UI works without Claude: it practises cards, dictation and queued exercises. Answers to translation exercises wait as `pending` until Claude evaluates them.

## Cost of the choice
Instant in-app feedback on a translation is gone: the phone shows "waiting for Claude" until a Claude session evaluates it. If that hurts, add an optional route that evaluates through OpenRouter with the same contract; it is parked in `planned/`.

## Amended 2026-10-20
- The app is thinner than first drawn: vocabulary and data are managed through MCP in a Claude chat (`add_words`, `update_words`, `remove_words`); the phone app keeps only the interactive parts and a read-only Words list.
- The rules for a clean dictionary are served by the MCP server itself (`src/mcp/word-rules.ts`), so any Claude client saves words the same way.
