// Screenshot README.md the way GitHub shows it: GitHub's markdown API for the
// HTML, github-markdown-css for the styles, and repo-relative images.
//   npm run preview -- <out-dir>     (needs an authenticated gh CLI)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(process.argv[2] || join(ROOT, "readme/.preview"));
mkdirSync(OUT, { recursive: true });

const html = execFileSync("gh", ["api", "markdown", "--input", "-"], {
  input: JSON.stringify({ text: readFileSync(join(ROOT, "README.md"), "utf8"), mode: "markdown", context: "FlintSH/tinderbox" }),
  encoding: "utf8", maxBuffer: 1 << 26,
});
// On github.com the <themed-picture> element picks the source for the viewer's
// theme even though the API wraps the <img> in a link. A static page has no
// such script, so unwrap the link and let <picture> choose natively.
const page_html = html.replace(/(<picture>[\s\S]*?)<a [^>]*>(<img [^>]*>)<\/a>/g, "$1$2");
const css = {};
for (const theme of ["light", "dark"]) {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-${theme}.css`);
  if (!res.ok) throw new Error(`github-markdown-css ${theme}: HTTP ${res.status}`);
  css[theme] = await res.text();
}

// GitHub's repo page: README box about 830px wide on desktop, 16px gutters on a phone.
const SHOTS = [
  { name: "desktop-dark", theme: "dark", width: 1280, box: 830, pad: 32 },
  { name: "desktop-light", theme: "light", width: 1280, box: 830, pad: 32 },
  { name: "mobile-dark", theme: "dark", width: 390, box: 390, pad: 16 },
  { name: "mobile-light", theme: "light", width: 390, box: 390, pad: 16 },
];
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const s of SHOTS) {
  const file = join(OUT, `${s.name}.html`);
  const bg = s.theme === "dark" ? "#0d1117" : "#ffffff", border = s.theme === "dark" ? "#3d444d" : "#d1d9e0";
  writeFileSync(file, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><base href="file://${ROOT}/">
<style>${css[s.theme]} body{margin:0;background:${bg}} .box{max-width:${s.box}px;margin:${s.width > 500 ? 24 : 0}px auto;border:${s.width > 500 ? `1px solid ${border}` : "0"};border-radius:6px}
.markdown-body{padding:${s.pad}px} details{margin-bottom:16px}</style>
<div class="box"><article class="markdown-body">${page_html}</article></div>`);
  const page = await browser.newPage({ viewport: { width: s.width, height: 900 }, deviceScaleFactor: s.width > 500 ? 1 : 2, colorScheme: s.theme });
  await page.goto("file://" + file);
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  // Each theme must load its own diagram (GitHub's <picture> sources).
  const srcs = await page.evaluate(() => [...document.querySelectorAll("picture img")].map((i) => i.currentSrc.split("/").pop()));
  const wrong = srcs.filter((src) => !src.includes(`-${s.theme}.`));
  if (wrong.length) throw new Error(`${s.name}: <picture> loaded ${wrong.join(", ")}`);
  await page.screenshot({ path: join(OUT, `${s.name}.png`), fullPage: true });
  await page.screenshot({ path: join(OUT, `${s.name}-top.png`) });
  console.log(`${s.name}.png${overflow > 0 ? `  OVERFLOW ${overflow}px` : ""}`);
  await page.close();
  rmSync(file);
}
await browser.close();
