# How to work in this repository

This is a content library run by an Elfo board, not an app. You make marketing content: ideas, scripts, images, videos and the copy that goes with them. Each card on the board is one piece.

## Read before you write

1. `brand/brand.md`: who we are, who we talk to, the voice, the words we use and never use, facts you may state. **Never state a fact (a feature, a number, a price, a customer, a date) that isn't there, in this repository, or on a page you just read.** If you need one, ask with `ask_human`.
2. `formats/<label>.md`: the card's label is its format. Sizes, lengths and rules live there.
3. `prompts/<column>.md`: the team's instructions for the step you're in.
4. `content/`: what already exists, so you don't repeat it.

## Where things go

- One folder per piece: `content/<card id>-<short-slug>/` (e.g. `content/MK-12-launch-carousel/`). Reuse it on later rounds.
  - `post.md`: the copy to publish, exactly as it should be posted (title, body, caption, hashtags, description, tags: whatever the format needs), with a short header saying where it goes.
  - The files to post at the top of the folder: `slide-01.png`…, `video.mp4`, `thumbnail.png`.
  - Their sources under `source/`: the HTML you rendered, AI image prompts (`source/prompts.md`), narration text.
  - `manifest.json`: format, files, tools and models used, and what paid calls cost.
- Never commit anything under `.preview/` (renders for your own checks), `node_modules/` or secrets.

## Making assets

- Use the skills in `.claude/skills/`: `slides` (images with text: carousels, Reddit images, thumbnails), `video` (animated videos from HTML), `ai-media` (AI images and voice, only when the keys exist).
- Text on images is always HTML, never drawn by an image model. AI images are backgrounds or photos behind it.
- Use `templates/base.css` and `brand/tokens.css`, so every piece looks like the brand.
- **Look at what you rendered.** Read every PNG and the stills of every video. Fix cut-off or overlapping text, typos, low contrast, anything off brand, then render again. Nobody should see a broken frame in review.

## Rules

- Write in the language `brand/brand.md` says.
- Paid APIs (fal.ai, ElevenLabs, OpenAI, Gemini) cost money on every call: plan first, generate once, reuse. Never loop on generations. Write what you spent in `manifest.json` and in your summary.
- Don't publish anything outside the **Publish** column, and there only what was approved, word for word.
- Never print, log or commit API keys.
