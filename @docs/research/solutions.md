# Ready-Made Solutions and MCP

Date: 2026-10-20. Prices and commit dates not verified; for commercial apps, data is from third-party reviews.

## Open source
| Project | What | Verdict |
|---|---|---|
| [Lute v3](https://github.com/LuteOrg/lute-v3) | Reading texts with a dictionary, word statuses (MIT) | LingQ analog without AI. No error analysis. Overkill |
| [Anki + FSRS](https://en.wikipedia.org/wiki/Anki_(software)) | Reviews, FSRS built in (23.10+). iOS ~$25 one-time | Best review layer. Doesn't track grammar |
| [Fluent (aymkin)](https://github.com/aymkin/fluent), [m98/fluent](https://github.com/m98/fluent) | Set of Claude Code skills: JSON databases for profile, errors, mastery; FSRS-6; MIT | Closest in architecture, but 0 stars, aimed at the DUO A2 exam, no audio. Reference |
| [IntelliCode (EACL 2026)](https://aclanthology.org/2026.eacl-demo.10) | Unified learner state schema | Reference for the profile |
| TutorGPT, LlamaTutor, LTEngine | General tutors / translator | Not suitable |

No ready-made project covers all the requirements.

## Commercial
Speak, Praktika, Langotalk — speaking trainers, shallow feedback, gamification, don't accept words from Google Translate. Duolingo Max (~$30/mo) — the most gamified. LingQ, Readlang, Language Reactor, Reverso Context — reading with a dictionary, don't analyze writing errors. Glossika, Pimsleur — ready-made content. Elsa — pronunciation only. None keeps a profile by error category.

## MCP and skills
- [ankimcp/anki-mcp-server](https://github.com/ankimcp/anki-mcp-server): MIT, 521 stars, 53 tools. The most mature. Use stdio only (tunnel mode goes through their cloud).
- [johwiebe/anki-mcp](https://github.com/johwiebe/anki-mcp): 7 simple tools + CEFR skill. An example, not a base.
- Kotoba, anki-duolingo-scraper — sources of ideas.
- No official Anthropic skill for languages.
- Limitation: all Anki MCPs require Anki running on the Mac. From iPhone — only deck sync via AnkiWeb.

## Conclusion: build your own, core from ready-made parts
Take ready-made: Anki (FSRS) + AnkiWeb for cards on iPhone; ankimcp (stdio) as a bridge; JSON profile structure ideas from Fluent.

Build yourself:
- import of Google Translate Saved (CSV) into SQLite with word statuses;
- generation of stories from words due for review at B1/B2 level;
- paragraph translation tasks in both directions; the answer is graded by Claude against a JSON schema (error type, correction, explanation);
- error table with frequency by category, from which the next task is chosen;
- TTS (engine chosen in research/tech.md);
- PWA on your own server (more convenient than a Telegram bot because of voice output).

Priority: first the cycle "words → story → translation → review → profile" (can be a Claude Code skill), then the PWA, then Anki.
