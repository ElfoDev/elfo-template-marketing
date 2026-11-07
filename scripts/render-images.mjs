#!/usr/bin/env node
/**
 * HTML → PNG. Renders each .html file (or every .html in a folder) with headless Chrome at the size in its
 * `<meta name="size" content="1080x1350">`, and warns about text that doesn't fit.
 *
 *   node scripts/render-images.mjs content/MK-3-x/source --out content/MK-3-x
 *   node scripts/render-images.mjs content/MK-3-x/source/slide-01.html --out content/MK-3-x --scale 2
 *
 * --out    folder for the PNGs (default: next to each HTML file)
 * --scale  device pixel ratio (default 1: a 1080×1350 page gives a 1080×1350 PNG)
 */
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { die, launchBrowser, layoutProblems, parseArgs, sizeFromHtml, waitReady } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args._.length) die("Usage: node scripts/render-images.mjs <file.html|folder>… [--out folder] [--scale 1]");
const files = args._.flatMap((p) => {
  const abs = resolve(p);
  if (statSync(abs).isDirectory()) return readdirSync(abs).filter((f) => f.endsWith(".html")).sort().map((f) => join(abs, f));
  return [abs];
});
if (!files.length) die("No .html files found.");
const scale = Number(args.scale || 1);

const browser = await launchBrowser();
let problems = 0;
for (const file of files) {
  const { width, height } = sizeFromHtml(file);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
  await waitReady(page);
  const outDir = args.out ? resolve(args.out) : dirname(file);
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, basename(file, ".html") + ".png");
  await page.screenshot({ path: out, type: "png", animations: "disabled" });
  const issues = await layoutProblems(page);
  problems += issues.length;
  console.log(`✓ ${out} (${width * scale}×${height * scale})`);
  for (const i of issues) console.log(`  ⚠ ${i}`);
  await page.close();
}
await browser.close();
if (problems) console.log(`\n${problems} layout warning(s): look at the PNGs and fix the HTML before you commit.`);
