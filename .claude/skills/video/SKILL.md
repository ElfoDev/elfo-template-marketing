---
name: video
description: Make videos (YouTube, Reels, Shorts, TikTok) as animated HTML scenes rendered frame by frame to MP4, with optional voice-over. Use for any video piece.
---

# Video: animated HTML → MP4

A video is one HTML page: a stage with scenes, each visible for a time range, animated with CSS. The renderer pauses
every animation, steps through time frame by frame and encodes an MP4. No frame drops, no screen recording.

## Steps

1. Write `source/video.html` from `templates/example-video.html`:
   ```html
   <meta name="video" content="width=1920, height=1080, fps=30, duration=45">
   ```
   Size and length from `formats/<label>.md` (1080×1920 for vertical).
2. Each scene is a `<section class="scene" style="--start: 6s; --dur: 4.5s">`. Scenes appear and fade on their own.
   The last scene can use `class="scene hold-end"` to stay until the end.
3. Inside a scene, entrances: add `class="in"` (rise), `in fade`, `in pop` or `in left`, with `style="--d: 0.4s"` for
   the delay after the scene starts. `.drift` slowly pushes in on a screenshot or photo for the whole scene.
   Any CSS `@keyframes` animation works, as long as it is on the page when it loads (no JS that adds classes later).
   For complex motion, define `window.seek = (seconds) => { … }` and draw the frame for that time yourself.
4. Sound off is the default viewer: every scene carries its message in on-screen text (`.caption`, headlines).
5. Voice-over (only with `ELEVENLABS_API_KEY`, see `ai-media`): generate it first, read its length, and time the scenes
   to it. Then render with `--audio`.
6. Check the layout fast, before the full render:
   ```bash
   node scripts/render-video.mjs content/<piece>/source/video.html --stills-only
   ```
   It saves a still from the middle of every scene in `.preview/` and warns about text outside the frame. **Read them.**
   Add `--stills 1.2,7,13.5` for specific moments (the first frame of the hook, transitions).
7. Render:
   ```bash
   node scripts/render-video.mjs content/<piece>/source/video.html --out content/<piece>/video.mp4 [--audio content/<piece>/source/voice.mp3]
   ```
   About 1 second of rendering per second of 1080p video. `--draft` for a quicker, rougher one.
8. Make the thumbnail or cover with the `slides` skill, and say the final length in your summary.

## Good videos

- The hook in the first 1–2 seconds, on screen. No logo intro.
- A new visual every 2–4 seconds (a new scene, a zoom, a highlight): static screens lose people.
- Real product footage: screenshots with `.drift`, or `<video data-start="12" src="clip.mp4" muted>` inside a scene
  (the renderer seeks it; `data-start` is when the clip starts in the video).
- One call to action at the end, with the link on screen for at least 3 seconds.
- Music only if you have the rights to it; mix it in with `--audio`.
