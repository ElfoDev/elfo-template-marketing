#!/usr/bin/env node
/**
 * Text → voice-over MP3 with ElevenLabs (ELEVENLABS_API_KEY). Prints the audio's length so scene timings can follow it.
 * Billed per character: generate once from the approved narration, then reuse the file.
 *
 *   node scripts/narrate.mjs --text-file content/MK-5-x/source/narration.txt --out content/MK-5-x/source/voice.mp3
 *
 * --voice  a voice id (default: media.json voice.elevenlabs.voiceId)
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { die, ffmpegPath, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const text = args.text ?? (args["text-file"] ? readFileSync(resolve(args["text-file"]), "utf8") : null);
if (!text || !args.out) die("Usage: node scripts/narrate.mjs --text-file narration.txt --out voice.mp3 [--voice id]");
const key = process.env.ELEVENLABS_API_KEY;
if (!key) die("No ELEVENLABS_API_KEY in the environment. In Elfo: board Settings → What agents can use → Add an app or tool → ElevenLabs. Without it, make the video with captions only.", 2);
const media = JSON.parse(readFileSync(new URL("../media.json", import.meta.url), "utf8"));
const cfg = media.voice?.elevenlabs ?? {};
const voice = args.voice || cfg.voiceId;

const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
  method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
  body: JSON.stringify({ text: text.trim(), model_id: cfg.model || "eleven_multilingual_v2" }),
});
if (!res.ok) die(`ElevenLabs answered ${res.status}: ${(await res.text()).slice(0, 500)}`);
const out = resolve(args.out);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(await res.arrayBuffer()));

// Length, from FFmpeg's own report.
const probe = spawnSync(await ffmpegPath(), ["-i", out, "-f", "null", "-"], { encoding: "utf8" });
const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe.stderr || "");
const seconds = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
console.log(JSON.stringify({ ok: true, out, voice, characters: text.trim().length, seconds }));
