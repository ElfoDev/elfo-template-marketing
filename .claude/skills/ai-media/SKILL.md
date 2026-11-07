---
name: ai-media
description: Generate AI images (photos, illustrations, backgrounds) with fal.ai, OpenAI or Gemini, and voice-over with ElevenLabs, through the repository's scripts. Use only when the script calls for them and the API key is in the environment; every call costs money.
---

# AI images and voice

These scripts call paid APIs with the keys Elfo put in your environment. Check first:

```bash
node -e 'for (const k of ["FAL_KEY","OPENAI_API_KEY","GEMINI_API_KEY","ELEVENLABS_API_KEY"]) console.log(k, process.env[k] ? "set" : "missing")'
```

No key → don't use them: make the visual with HTML (skills `slides` and `video`) and say so in your summary. A person
can add a key in Elfo: board **Settings → What agents can use → Add an app or tool → AI images, video and voice**.

## Images

```bash
node scripts/generate-image.mjs --prompt "…" --aspect 4:5 --out content/<piece>/source/hero.png
```

- Never ask for text in the image. Text goes on top, in HTML.
- Write the prompt like an art director: subject, setting, composition (where the empty space for text is), light,
  style, colors from `brand/tokens.css`. Say what to avoid ("no text, no logos, no watermarks").
- Generate once, look at it (Read the PNG), and only regenerate if it's unusable. At most 3 calls per image.
- Save every prompt with its file name in `source/prompts.md`, and the cost (`approxUsd` in the script's output) in
  `manifest.json`.
- Models are in `media.json`. If a call says the model doesn't exist, the provider renamed it: tell the team in your
  summary instead of guessing names.

## Voice-over

```bash
node scripts/narrate.mjs --text-file content/<piece>/source/narration.txt --out content/<piece>/source/voice.mp3
```

- Narrate the approved script word for word. Write numbers and names the way they should be said.
- The output gives `seconds`: time the video's scenes to it, then render with `--audio`.
- One call per narration. Billed per character.
