# Technical Implementation

Date: 2026-10-20. Not verified by hand: Takeout, the export-to-Sheets button, PWA microphone on iPhone, model prices on OpenRouter.

## 1. Words from Google Translate Saved
1. Check takeout.google.com: is there "Translate" (2 minutes). No confirmation found in search.
2. Check the "Export to Google Sheets" button in Phrasebook ([2023 example](https://lingualinx.com/blog/save-your-language-translations-with-google-translate-phrasebook)); whether it is still current is not verified.
3. Fallback: Playwright with a logged-in profile on `translate.google.com/saved`, scroll and pull pairs from the DOM. No ready-made script, write the selectors yourself. Enough for a one-off import (~200 words).

No working unofficial APIs or extensions found.

## 2. iOS and Web Speech API
- `speechSynthesis` (voice output) works in Safari; Chrome on iOS uses WebKit, same voices. Free, quality depends on downloaded voices (Enhanced/Premium).
- `webkitSpeechRecognition` exists since iOS 14.5, but historically doesn't work in a PWA from the home screen ([WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=225298)). A fix in iOS 18/26 is not confirmed.
- Background audio in a PWA is unstable.
- Conclusion: do STT via `MediaRecorder` + server-side STT. Test `MediaRecorder` on your iPhone first.

## 3. TTS and STT via API
OpenRouter has an [audio API](https://openrouter.ai/blog/announcements/announcing-audio-apis/): TTS `/api/v1/audio/speech` (gpt-4o-mini-tts, gemini-3.1-flash-tts, voxtral-mini-tts), STT `/api/v1/audio/transcriptions` (whisper-large-v3, gpt-4o-transcribe, chirp-3). One key for LLM, TTS and STT.

| Option | Price | Notes |
|---|---|---|
| gpt-4o-mini-tts | ~$0.015/min | tone and accent via `instructions` |
| gpt-4o-mini-transcribe | $0.003/min | whisper $0.006/min |
| Google Cloud TTS | Standard/WaveNet $4/1M chars, Neural2 $16, Chirp 3 HD $30 | free tier 1–4M chars/mo |
| ElevenLabs | ~$0.05–0.10 per 1000 chars | best quality, expensive |
| [edge-tts](https://pypi.python.org/pypi/edge-tts) | free | unofficial endpoint, may break |
| Kokoro 82M | open-weight | self-host on Hetzner, slow on CPU |

Pronunciation: for the MVP compare the STT transcript with the expected text; Azure Pronunciation Assessment (~$0.30/hour) — after the MVP.

## 4. Architecture
- Next.js PWA (no App Store). Expo only if the PWA fails the microphone test.
- Postgres + FastAPI/Django on Hetzner in Docker.
- FSRS: [ts-fsrs](https://www.jsdelivr.com/package/npm/ts-fsrs) (MIT). Derive the Again/Hard/Good/Easy grade from the LLM result.
- Translation grading via OpenRouter, structured output:
```json
{"score":0-5,"correct":bool,"errors":[{"category":"tense|article|preposition|word_order|vocab|agreement|spelling","span":"...","fix":"...","note":"..."}],"better_version":"..."}
```
- Error profile: counter per category with time decay; the 2–3 most frequent categories go into the next story's generation prompt; difficulty by share correct over the last 20.
- Audio cache: key `sha256(text+voice+model)` → mp3 on the server/R2.

## 5. Cost (estimate, 60 min/day)
LLM $1–3, TTS $0–7 (less with cache), STT ~$2. Total ~$3–12/mo.

## MVP in 1–2 Days
Day 1: word import → story generation using the profile → translation grading with the error schema → FSRS.
Day 2: TTS with cache → UI (story, input, review) → voice recording via MediaRecorder (test on iPhone first) → error profile screen → deploy.
