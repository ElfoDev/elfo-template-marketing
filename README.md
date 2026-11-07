# Content library for Elfo

This repository is a **content library**, not an app. An [Elfo](https://elfo.dev) board with the **Marketing** workflow runs Claude agents on it:

| Column | Who | What happens |
| --- | --- | --- |
| **Idea generator** | agent | You drop a brief card ("10 ideas for the launch"). The agent reads `brand/`, `formats/` and what's already in `content/`, then creates one card per idea in **Ideas**. Comment and press **Run** for another batch. |
| **Ideas** | you | Drag the good ones to **Script**. Delete the rest. |
| **Script** | agent | Writes the copy and the plan (slides, scenes, timings) for the card's format. You approve or request changes. |
| **Production** | agent | Renders the images and videos into `content/<card>-<slug>/` on the card's branch. The card page shows them. You approve or request changes. |
| **Ready to publish** | Elfo | Merges the piece into `main`: it's now in the library. |
| **Publish** | agent | Posts it with the apps you connected (Reddit, YouTube, LinkedIn, Instagram), or hands you a ready-to-paste kit. |

Every version of every piece is a commit, every approved piece is a merged pull request, and your prompts live in `prompts/` next to what they produced.

## What's here

```
CLAUDE.md          how agents work in this repository (read first)
brand/             brand.md (who you are, voice, do/don't), tokens.css (colors, fonts), logo.svg
formats/           one file per format: sizes, lengths, rules (the card's label names it)
prompts/           the team's instructions for each column; edit them, they're versioned
templates/         base.css and example HTML for slides and video scenes
scripts/           render-images.mjs (HTML → PNG), render-video.mjs (HTML → MP4),
                   generate-image.mjs (AI images, optional), narrate.mjs (voice-over, optional)
.claude/skills/    slides, video, ai-media: how to make each kind of asset
media.json         which AI models the scripts use
content/           one folder per piece: post.md, the images/videos to post, and their sources
```

## No keys needed to start

Text, carousels, thumbnails and animated videos are made with HTML and CSS, rendered by the headless Chrome that GitHub Actions already has, and encoded with FFmpeg. That costs nothing beyond your Claude plan.

Optional, for more:

| Key | What it adds | Where |
| --- | --- | --- |
| `FAL_KEY` | AI photos and illustrations (Nano Banana Pro by default, about $0.15 an image; any fal model in `media.json`) | [fal.ai](https://fal.ai/dashboard/keys) |
| `ELEVENLABS_API_KEY` | Voice-over for videos | [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | Other image models | OpenAI, Google AI Studio |

Add them in Elfo: board **Settings → What agents can use → Add an app or tool → AI images, video and voice**. Paste the key once; agents get it as an environment variable. Publishing apps (Reddit, YouTube, LinkedIn, Instagram) are one click in the same dialog, under **Apps**.

## Make it yours

1. Fill in `brand/brand.md` and `brand/tokens.css`, and replace `brand/logo.svg`.
2. Keep the formats you use in `formats/`, delete the others, add your own (the file name is the card label).
3. Read `prompts/`; change anything that doesn't sound like your team.

## Run the scripts yourself

```bash
npm ci
node scripts/render-images.mjs templates/example-slide.html --out /tmp/out
node scripts/render-video.mjs templates/example-video.html --out /tmp/out/example.mp4
```

They use the Google Chrome installed on the machine (`CHROME_PATH` to point elsewhere) and the FFmpeg that `ffmpeg-static` installs.
