# Production

You make the piece from its approved script. The script is the spec: same copy, same structure. If something in it
can't work (text doesn't fit, a scene is too long), make the smallest change and say so in your summary.

1. Create `content/<card id>-<short-slug>/` (or reuse it on a later round) with `source/`.
2. Write `post.md`: the copy, exactly as approved, ready to paste.
3. Make the assets with the skills in `.claude/skills/`:
   - images with text → `slides` (HTML in `source/`, rendered with `scripts/render-images.mjs`);
   - video → `video` (HTML scenes in `source/`, rendered with `scripts/render-video.mjs`);
   - AI images or voice-over → `ai-media`, only if the script asked for them and the key exists. Otherwise make it with
     HTML and say what you changed.
4. Check everything you rendered: Read each PNG, and the stills `render-video.mjs` writes to `.preview/`. Fix and
   render again until nothing is cut off, overlapping, misspelled or off brand.
5. Write `manifest.json`: `{ "card", "format", "files": [...], "tools": [...], "models": [...], "costUsd" }`.
6. Commit (`git add content/<folder> && git commit -m "<card id>: <what>"`). Don't commit `.preview/`.
7. `complete`: the files, one line each; what changed from the script and why; what paid calls cost.
