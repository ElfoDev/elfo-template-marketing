#!/usr/bin/env node
/**
 * AI image → PNG, for photos and backgrounds (never for text: put text on top with HTML). Uses the first key it finds:
 * FAL_KEY (fal.ai), OPENAI_API_KEY, GEMINI_API_KEY. Models are in media.json. Every call costs money: plan, then call once.
 *
 *   node scripts/generate-image.mjs --prompt "…" --out content/MK-3-x/source/hero.png --aspect 4:5
 *
 * --aspect    1:1, 4:5, 3:4, 16:9, 9:16… (default 1:1)
 * --provider  fal | openai | gemini (default: the first with a key)
 * --model     override media.json for this call
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { die, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.prompt || !args.out) die('Usage: node scripts/generate-image.mjs --prompt "…" --out path.png [--aspect 4:5] [--provider fal|openai|gemini]');
const media = JSON.parse(readFileSync(new URL("../media.json", import.meta.url), "utf8"));
const keys = { fal: process.env.FAL_KEY, openai: process.env.OPENAI_API_KEY, gemini: process.env.GEMINI_API_KEY };
const provider = args.provider || Object.keys(keys).find((k) => keys[k]);
if (!provider || !keys[provider]) die("No image API key in the environment (FAL_KEY, OPENAI_API_KEY or GEMINI_API_KEY). In Elfo: board Settings → What agents can use → Add an app or tool → AI images, video and voice. Without one, make the visual with HTML (skill: slides).", 2);
const aspect = args.aspect || "1:1";
const cfg = media.image?.[provider] ?? {};
const model = args.model || cfg.model;

async function call(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
  if (!res.ok) die(`${provider} answered ${res.status}: ${JSON.stringify(data).slice(0, 600)}${res.status === 404 || /model/i.test(text) ? `\nIs "${model}" still a current model? Change it in media.json.` : ""}`);
  return data;
}

let bytes;
if (provider === "fal") {
  const data = await call(`https://fal.run/${model}`, {
    method: "POST", headers: { Authorization: `Key ${keys.fal}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: args.prompt, aspect_ratio: aspect, num_images: 1, output_format: "png", ...(cfg.resolution ? { resolution: cfg.resolution } : {}) }),
  });
  const url = data.images?.[0]?.url;
  if (!url) die(`fal returned no image: ${JSON.stringify(data).slice(0, 400)}`);
  bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
} else if (provider === "openai") {
  const [w, h] = aspect.split(":").map(Number);
  const size = !w || !h || w === h ? "1024x1024" : w < h ? "1024x1536" : "1536x1024";
  const data = await call("https://api.openai.com/v1/images/generations", {
    method: "POST", headers: { Authorization: `Bearer ${keys.openai}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: args.prompt, n: 1, size, ...(cfg.quality ? { quality: cfg.quality } : {}) }),
  });
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) die(`OpenAI returned no image: ${JSON.stringify(data).slice(0, 400)}`);
  bytes = Buffer.from(b64, "base64");
} else if (provider === "gemini") {
  const data = await call(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": keys.gemini, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: args.prompt }] }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } } }),
  });
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) die(`Gemini returned no image: ${JSON.stringify(data).slice(0, 400)}`);
  bytes = Buffer.from(part.inlineData.data, "base64");
} else die(`Unknown provider ${provider}.`);

const out = resolve(args.out);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, bytes);
console.log(JSON.stringify({ ok: true, out, provider, model, aspect, approxUsd: cfg.approxUsdPerImage ?? null }));
