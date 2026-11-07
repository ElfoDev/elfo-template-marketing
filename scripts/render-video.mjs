#!/usr/bin/env node
/**
 * HTML → MP4. The page is a stage of scenes animated with CSS (see .claude/skills/video). The renderer pauses every
 * animation and steps through time frame by frame, so the video is exact and never drops frames, then encodes with
 * FFmpeg (H.264, yuv420p, faststart: plays everywhere). Format from `<meta name="video" content="width=1920,
 * height=1080, fps=30, duration=45">`.
 *
 *   node scripts/render-video.mjs content/MK-5-x/source/video.html --out content/MK-5-x/video.mp4 --audio content/MK-5-x/source/voice.mp3
 *   node scripts/render-video.mjs content/MK-5-x/source/video.html --stills-only     # just the stills, to check the layout fast
 *
 * --out          the MP4 (default: next to the HTML)
 * --audio        an audio track (voice-over, music you have the rights to); padded or cut to the video's length
 * --stills       seconds to save as PNGs in .preview/ for checking, e.g. "1,4.5,12" (default: the middle of every scene)
 * --stills-only  save the stills and stop
 * --draft        half the frame rate and a faster encode, for a quick look
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { die, ffmpegPath, launchBrowser, layoutProblems, parseArgs, videoFromHtml, waitReady } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), ["draft", "stills-only"]);
const file = args._[0] && resolve(args._[0]);
if (!file) die("Usage: node scripts/render-video.mjs <video.html> [--out video.mp4] [--audio voice.mp3] [--stills 1,5] [--draft]");
const fmt = videoFromHtml(file);
if (!fmt) die(`${file} needs <meta name="video" content="width=1920, height=1080, fps=30, duration=45">.`);
const fps = args.draft ? Math.max(1, Math.round(fmt.fps / 2)) : fmt.fps;
const frames = Math.round(fmt.duration * fps);
const out = resolve(args.out || join(dirname(file), basename(file, ".html") + ".mp4"));

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: fmt.width, height: fmt.height } });
await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
await waitReady(page);

// Time control: every CSS animation/transition paused at `ms`; <video data-start="2"> elements seeked; window.seek(s) if the page has one.
const seek = (ms) => page.evaluate(async (ms) => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
  if (typeof window.seek === "function") await window.seek(ms / 1000);
  await Promise.all([...document.querySelectorAll("video")].map((v) => new Promise((done) => {
    const t = Math.max(0, ms / 1000 - Number(v.dataset.start || 0));
    v.muted = true; v.pause();
    if (Math.abs(v.currentTime - t) < 0.001) return done();
    const timer = setTimeout(done, 3000);
    v.addEventListener("seeked", () => { clearTimeout(timer); done(); }, { once: true });
    v.currentTime = t;
  })));
  // Two frames, so layout, images and big layers are painted before the screenshot (no half-rastered tiles).
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}, ms);

// Stills for checking: default the middle of each scene.
const sceneMids = await page.evaluate(() => [...document.querySelectorAll(".scene")].map((s) => {
  const cs = getComputedStyle(s);
  const sec = (v) => (v.endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v));
  return sec(cs.getPropertyValue("--start") || "0s") + sec(cs.getPropertyValue("--dur") || "0s") / 2;
}));
const stills = (args.stills ? String(args.stills).split(",").map(Number) : sceneMids.length ? sceneMids : [fmt.duration / 2]).filter((t) => t >= 0 && t <= fmt.duration);
const previewDir = resolve(".preview");
mkdirSync(previewDir, { recursive: true });
let warnings = 0;
for (const t of stills) {
  await seek(t * 1000);
  const p = join(previewDir, `${basename(file, ".html")}-${t.toFixed(1)}s.png`);
  await page.screenshot({ path: p, type: "png" });
  const issues = await layoutProblems(page);
  warnings += issues.length;
  console.log(`still ${p}`);
  for (const i of issues) console.log(`  ⚠ at ${t.toFixed(1)}s: ${i}`);
}
if (args["stills-only"]) { await browser.close(); process.exit(0); }

mkdirSync(dirname(out), { recursive: true });
const ff = spawn(await ffmpegPath(), [
  "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  ...(args.audio ? ["-i", resolve(args.audio)] : []),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", args.draft ? "veryfast" : "medium", "-crf", args.draft ? "26" : "18", "-r", String(fps),
  ...(args.audio ? ["-c:a", "aac", "-b:a", "192k", "-af", "apad", "-shortest"] : []),
  "-movflags", "+faststart", out,
], { stdio: ["pipe", "inherit", "inherit"] });
const finished = new Promise((ok, fail) => { ff.on("error", fail); ff.on("close", (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited with ${code}`)))); });

const started = Date.now();
for (let i = 0; i < frames; i++) {
  await seek((i * 1000) / fps);
  const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % Math.max(1, Math.round(frames / 10)) === 0) console.log(`frame ${i + 1}/${frames} (${Math.round(((i + 1) / frames) * 100)}%)`);
}
ff.stdin.end();
await finished.catch((e) => die(`Encoding failed: ${e.message}`));
await browser.close();
console.log(`✓ ${out} · ${fmt.width}×${fmt.height} · ${fps} fps · ${fmt.duration}s · rendered in ${Math.round((Date.now() - started) / 1000)}s`);
if (warnings) console.log(`${warnings} layout warning(s) in the stills: look at them in .preview/ and fix the HTML.`);
