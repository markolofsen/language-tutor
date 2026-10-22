# 0005 — A translator in the app, through an OpenAI-compatible API

**ACCEPTED 2026-10-22.** Owner: Mark.

## Decision
The Translate tab translates as you type, in the two languages of the learner (native, target; set in Profile, default Russian and English), detects the direction by itself and offers to save the words into the dictionary. The call is one `chat/completions` request with a strict `json_schema` to an OpenAI-compatible endpoint (OpenRouter by default, default model `openai/gpt-5-mini`), made with plain `fetch` from a route handler (`/api/translate`), behind the same sign-in as the rest of the app. The key is `OPENROUTER_API_KEY` in the environment or a key saved in Profile (kept in the `settings` table, never sent back to the browser).

## Why
- A translator is the place a learner meets new words all day; saving them from there, with a hook and the sentence they came from, feeds the same dictionary and the same FSRS cards as everything else.
- No SDK: the request is one JSON post. An SDK would add a dependency and tie the app to one provider; `OPENROUTER_BASE_URL` lets anyone point it at another compatible endpoint.
- Structured output makes the answer always parse; the same zod schema validates it and generates the JSON schema.
- The key stays on the server: a browser never sees it, so a self-hosted instance can hold it in the environment, or in a vault proxy, and the page only knows "a key exists".

## What it costs and what is left
- Each pause while typing is a paid request (a fraction of a cent); identical input is cached and calls are capped per minute.
- The tutor's prompts and the UI copy are still Russian-to-English; only the translator and the `languages` entry of `get_learner_context` follow the setting. See the any-language plan.
- Listening (live speech to translation) is researched, not built: [translator.md](../../@docs/research/translator.md).
