// Shared helpers for the render scripts: argument parsing, finding Chrome and FFmpeg, waiting for a page to be ready.
import { existsSync, readFileSync } from "node:fs";
import { chromium } from "playwright-core";

/** `--out x --draft a b` → { out: "x", draft: true, _: ["a", "b"] } */
export function parseArgs(argv, flags = []) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const [k, inline] = a.slice(2).split("=", 2);
    if (inline !== undefined) out[k] = inline;
    else if (flags.includes(k)) out[k] = true;
    else out[k] = argv[++i];
  }
  return out;
}

export function die(message, code = 1) {
  console.error(`✗ ${message}`);
  process.exit(code);
}

const CHROME_CANDIDATES = [
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome",
  "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

/** Headless Chrome: CHROME_PATH, else the Chrome installed on the machine (GitHub Actions' ubuntu-latest has one). */
export async function launchBrowser() {
  const executablePath = process.env.CHROME_PATH || CHROME_CANDIDATES.find((p) => existsSync(p));
  try {
    return await chromium.launch(executablePath ? { executablePath, args: ["--font-render-hinting=none", "--hide-scrollbars"] } : { channel: "chrome" });
  } catch (e) {
    die(`Couldn't start Chrome (${e.message.split("\n")[0]}). Install Google Chrome or set CHROME_PATH.`);
  }
}

/** FFmpeg: FFMPEG_PATH, the binary ffmpeg-static installed, or `ffmpeg` on the PATH. */
export async function ffmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const mod = await import("ffmpeg-static");
    if (mod.default && existsSync(mod.default)) return mod.default;
  } catch { /* not installed */ }
  return "ffmpeg";
}

/** Fonts loaded, images decoded, and the page's own `window.ready` promise if it has one. */
export async function waitReady(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null))));
    if (window.ready && typeof window.ready.then === "function") await window.ready;
  });
}

/** `<meta name="size" content="1080x1350">` → { width, height } */
export function sizeFromHtml(file, fallback = { width: 1080, height: 1350 }) {
  const m = /<meta\s+name=["']size["']\s+content=["'](\d+)\s*[x×]\s*(\d+)["']/i.exec(readFileSync(file, "utf8"));
  return m ? { width: Number(m[1]), height: Number(m[2]) } : fallback;
}

/** `<meta name="video" content="width=1920, height=1080, fps=30, duration=45">` */
export function videoFromHtml(file) {
  const m = /<meta\s+name=["']video["']\s+content=["']([^"']+)["']/i.exec(readFileSync(file, "utf8"));
  if (!m) return null;
  const kv = Object.fromEntries(m[1].split(",").map((p) => p.trim().split("=").map((s) => s.trim())));
  const v = { width: Number(kv.width), height: Number(kv.height), fps: Number(kv.fps || 30), duration: Number(kv.duration) };
  return v.width && v.height && v.duration ? v : null;
}

/**
 * Text that doesn't fit: elements sticking out of the frame, and boxes whose content overflows them. Returns one line
 * per problem, so whoever renders can fix the layout instead of shipping a cut-off word. `data-bleed` opts out.
 */
export async function layoutProblems(page) {
  return page.evaluate(() => {
    const W = window.innerWidth, H = window.innerHeight;
    const out = [];
    const label = (el) => {
      const text = (el.innerText || el.getAttribute("alt") || "").trim().replace(/\s+/g, " ").slice(0, 50);
      return `<${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? ` class="${el.className}"` : ""}>${text ? ` "${text}"` : ""}`;
    };
    for (const el of document.body.querySelectorAll("*")) {
      if (el.closest("[data-bleed]")) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText && (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1)) out.push(`outside the frame: ${label(el)}`);
      if ((cs.overflow === "hidden" || cs.overflowY === "hidden" || cs.overflowX === "hidden") && el !== document.body && el.tagName !== "HTML"
        && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) && el.innerText?.trim()) out.push(`content cut off inside: ${label(el)}`);
    }
    return [...new Set(out)].slice(0, 12);
  });
}
