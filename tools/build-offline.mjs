// Builds an offline copy of the demo: one self-contained HTML file that opens by double-click,
// with no web server and no internet. JS modules are bundled with esbuild into a classic script;
// CSS, Lucide, logos and the two web fonts are inlined.
// Usage (needs internet once, for esbuild and the fonts): node tools/build-offline.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist-offline");
const OUT_FILE = join(OUT_DIR, "CBQ_ERP_Connect_Demo_offline.html");
const ESBUILD = "esbuild@0.24.0";
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&display=swap";
// A modern browser UA makes Google Fonts return woff2.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const dataUri = (p, type) => `data:${type};base64,${readFileSync(join(ROOT, p)).toString("base64")}`;
// Inline scripts must never contain a closing script tag.
const safeScript = (js) => js.replace(/<\/script/gi, "<\\/script");

function bundleJs() {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  return execFileSync(npx, ["--yes", ESBUILD, "assets/js/main.js", "--bundle", "--format=iife", "--minify", "--target=es2020"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, shell: process.platform === "win32" });
}

/** Fetch the Google Fonts CSS and replace each latin font URL with an embedded woff2. */
async function inlineFonts() {
  const res = await fetch(FONT_CSS, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Font CSS request failed: ${res.status}`);
  const css = await res.text();
  // Keep only the latin subsets: the demo is English, and this keeps the file small.
  const blocks = css.split("/* ").filter((b) => b.startsWith("latin */")).map((b) => b.slice("latin */".length));
  if (!blocks.length) throw new Error("No latin font blocks found");
  const out = [];
  for (const block of blocks) {
    const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) throw new Error("Font block without a woff2 URL");
    const font = await fetch(url, { headers: { "User-Agent": UA } });
    if (!font.ok) throw new Error(`Font download failed: ${font.status}`);
    const b64 = Buffer.from(await font.arrayBuffer()).toString("base64");
    out.push(block.replace(url, `data:font/woff2;base64,${b64}`).trim());
  }
  return out.join("\n");
}

async function main() {
  const html = read("index.html");
  const css = ["assets/css/tokens.css", "assets/css/base.css", "assets/css/components.css"].map(read).join("\n");
  const fonts = await inlineFonts();
  const lucide = read("assets/vendor/lucide-0.460.0.min.js");
  const app = bundleJs();
  const img = {
    "assets/img/ivl-mark.png": dataUri("assets/img/ivl-mark.png", "image/png"),
    "assets/img/ivl-logo.png": dataUri("assets/img/ivl-logo.png", "image/png"),
    "assets/img/ivl-logo-light.png": dataUri("assets/img/ivl-logo-light.png", "image/png"),
  };

  let page = html
    .replace(/<link rel="preconnect"[^>]*>\n?/g, "")
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, "")
    .replace(/<link rel="stylesheet" href="assets\/css\/[^"]+">\n?/g, "")
    .replace(/<script src="assets\/vendor\/[^"]+" defer><\/script>\n?/, "")
    .replace(/<script type="module" src="assets\/js\/main\.js"><\/script>/,
      // Lucide first, then the app, both synchronous at the end of body so order is guaranteed.
      () => `<script>${safeScript(lucide)}</script>\n<script>${safeScript(app)}</script>`)
    .replace("</head>", () => `<style>\n${fonts}\n${css}\n</style>\n</head>`)
    .replace("<title>CBQ ERP Connect Demo</title>", "<title>CBQ ERP Connect Demo (offline)</title>");
  for (const [path, uri] of Object.entries(img)) page = page.split(path).join(uri);

  const leftovers = page.match(/(src|href)="(assets\/|https?:)[^"]*"/g);
  if (leftovers) throw new Error(`External references left: ${leftovers.join(", ")}`);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR);
  writeFileSync(OUT_FILE, page);
  writeFileSync(join(OUT_DIR, "README.txt"), [
    "CBQ ERP Connector Platform - offline demo",
    "",
    "Double-click CBQ_ERP_Connect_Demo_offline.html. It opens in Edge or Chrome and runs with no internet",
    "and no web server. Everything (code, styles, icons, logos, fonts) is inside that one file.",
    "",
    "All data in the demo is synthetic. Use Reset demo in the top bar before each run.",
    "",
  ].join("\r\n"));
  console.log(`Wrote ${OUT_FILE} (${(page.length / 1024).toFixed(0)} KB)`);
}

main().catch((err) => { console.error(`Offline build failed: ${err.message}`); process.exit(1); });
