# Translator: what Google Translate lacks and what an LLM can do

Date: 2026-10-22. Searched once per question; most sources are vendor or affiliate blogs, so read the claims as direction, not measurement. Prices and the model list come from OpenRouter's public models API on the same day. Latency was NOT measured (no API key was at hand).

## What people dislike in Google Translate
- **Idioms and fixed phrases come out word for word.** Common ones are fixed now; less common idioms, slang and verbal idioms still lag behind LLMs in the studies found ([arXiv 2508.17458](https://arxiv.org/pdf/2508.17458)).
- **No control over tone.** One comparison lists "no control" over formality for Google and prompt-level control for an LLM ([intlpull](https://intlpull.com/blog/machine-translation-accuracy-2026-benchmark), [taia](https://taia.io/resources/blog/deepl-vs-google-translate-vs-microsoft-translator/)).
- **One answer, no why.** It gives a single rendering with no alternatives and no note about a trap, which is what a learner needs. (Not directly confirmed by the sources; it is how the product behaves.)
- **Context.** LLMs use the surrounding sentence better; one clinical-text study reported GPT-4 ahead of Google for English to Russian ([intlpull](https://intlpull.com/blog/machine-translation-accuracy-2026-benchmark)). Evidence is mixed and prompt-dependent.
- **Saving is a dead end for study.** Saved translations are a flat list: no base form, no hook, no review. Google added a Gemini "Practice mode" and live conversation in 2025 ([the-decoder](https://the-decoder.com/google-translate-adds-live-conversation-and-language-learning-features/)), but practice is separate from the words you actually saved.

## What this app does differently
One input, two languages, direction detected. Structured output per request: translation, up to two alternatives with a short note, a trap note, and up to five words worth learning with a gloss and a hook. One tap saves them, each with the sentence it came from as a review card (due in 20 hours, see the hook research in [methods.md](methods.md)).

## API and models
- OpenRouter is OpenAI-compatible; `response_format: {type: "json_schema", strict: true}` forces the shape ([docs](https://openrouter.ai/docs/guides/features/structured-outputs)). Support is per endpoint: a model can lack it. The app calls `chat/completions` with plain `fetch`, so any OpenAI-compatible base URL works (`OPENROUTER_BASE_URL`).
- Candidates (input / output per million tokens, all support structured outputs): `openai/gpt-5-mini` $0.25 / $2 (reasoning model; the app asks for `reasoning.effort = minimal`), `openai/gpt-5-nano` $0.05 / $0.40, `openai/gpt-4.1-mini` $0.40 / $1.60 (no reasoning, usually the quickest of the OpenAI trio), `google/gemini-2.5-flash-lite` $0.10 / $0.40 (also takes audio). A request is a few hundred tokens: a fraction of a cent.
- Live translation while typing: debounce 500 ms, cancel the previous request, cache identical input, cap calls per minute. If `gpt-5-mini` feels slow while typing, switch the model in Profile; nothing else changes.

## Listening mode (not built)
- **OpenRouter speech-to-text** is a batch endpoint, `POST /api/v1/audio/transcriptions` with base64 audio; models: Whisper-class and newer token-billed ones, some with word timestamps ([docs](https://openrouter.ai/docs/guides/overview/multimodal/stt)). No streaming or realtime endpoint was found. A live mode would send 5 to 8 second chunks.
- **Browser speech recognition** (`webkitSpeechRecognition`) gives free live text, but a WebKit bug report says it is unavailable in Home Screen web apps, and a 2024 Apple forum thread reports the same ([WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=225298)). It works in plain Safari on iOS 14.5 and later. Not verified for a current iOS version, Russian or English.
- Plan: first try recognition in Safari (free, live), fall back to chunked upload to OpenRouter STT, send the text to the same translator. Test on the iPhone before building; the earlier voice work found the PWA microphone unreliable.
