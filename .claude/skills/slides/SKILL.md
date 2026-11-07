---
name: slides
description: Make images that carry text (carousel slides, Reddit gallery images, LinkedIn images, YouTube thumbnails, video covers) as HTML rendered to PNG at the exact size. Use for any image with words on it.
---

# Slides: images with text, from HTML

Image models misspell and can't follow a brand. Every image with text is an HTML page rendered to PNG.

## Steps

1. One HTML file per image in the piece's `source/` folder: `slide-01.html`, `slide-02.html`… (or `image-01.html`,
   `thumbnail.html`), named like the PNG you want.
2. Start from `templates/example-slide.html`. Keep the two stylesheets (paths are relative to the HTML file):
   ```html
   <meta name="size" content="1080x1350">
   <link rel="stylesheet" href="../../../brand/tokens.css">
   <link rel="stylesheet" href="../../../templates/base.css">
   ```
   Set the size from `formats/<label>.md`. For a 1280×720 thumbnail or a 1920×1080 frame, scale the type up with
   `.frame { --k: 1.3 }`.
3. Lay out with the classes in `templates/base.css` (`.frame.dark|brand`, `.eyebrow`, `.h1`–`.h3`, `.lead`, `.body`,
   `.mark`, `.hl`, `.chip`, `.list`, `.shot`, `.foot`). Add a `<style>` block for anything specific; use the tokens,
   never new colors or fonts.
4. Screenshots and photos: put the file in `source/` and use `<img class="shot" src="screenshot.png">`. AI images: see
   the `ai-media` skill, then use them as backgrounds (`object-fit: cover`) with text on a solid or darkened area.
5. Render all of them at once:
   ```bash
   node scripts/render-images.mjs content/<piece>/source --out content/<piece>
   ```
   Only the HTML files you want as images belong in `source/` (move helpers elsewhere), or pass the files one by one.
6. **Read every PNG.** Fix whatever the script warns about (`⚠ outside the frame`, `content cut off`) and anything you
   see: text too small for a phone, lines breaking badly, empty space, poor contrast. Render again.

## Good slides

- One idea per slide; the headline says it, the rest supports it.
- Text big enough at phone size: headlines 64 px or larger, body 34 px or larger on a 1080-wide image.
- Consistent layout across a carousel: same margins, same position for the headline, a page counter.
- Real screenshots beat drawings. Crop them to the part that matters and make it big.
