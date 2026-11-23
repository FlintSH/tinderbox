// Render the README: the animated header GIF (one frame per blue-bg.gif
// frame), the flow diagram SVGs, and README.md from README.template.md.
//   cd readme && npm install && npm run render [-- panel ...]
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import gifenc from "gifenc";
import { repoData, readCopy } from "./data.mjs";
import { flowSvg, flowAlt } from "./flow.mjs";

const { GIFEncoder, quantize, applyPalette } = gifenc;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = join(ROOT, "assets/readme");
const ANIMATED = new Set(["header"]);
const FRAME_MS = 60; // blue-bg.gif's own frame delay

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".gif": "image/gif", ".woff2": "font/woff2", ".ttf": "font/ttf" };
const server = createServer((req, res) => {
  const file = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}/readme/panels/`;

const TBX = { copy: readCopy(join(HERE, "copy.md")), data: repoData(ROOT) };
const wanted = process.argv.slice(2);
const panels = readdirSync(join(HERE, "panels")).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5))
  .filter((p) => !wanted.length || wanted.includes(p));

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 800 }, deviceScaleFactor: 2 });
await page.addInitScript((tbx) => { window.TBX = tbx; }, TBX);
mkdirSync(OUT, { recursive: true });

const encodeGif = (frames) => {
  const { width, height } = frames[0];
  // One palette for every frame, sampled across all of them, plus a transparent slot.
  const sample = new Uint8Array(frames.reduce((n, f) => n + f.data.length / 4, 0) / 4 * 4 | 0);
  let o = 0;
  for (const f of frames) for (let i = 0; i < f.data.length && o < sample.length; i += 16) sample.set(f.data.subarray(i, i + 4), o), (o += 4);
  const palette = quantize(sample.subarray(0, o), 255, { format: "rgb565" });
  const T = palette.length; palette.push([0, 0, 0]);
  const gif = GIFEncoder();
  let prev = null;
  for (const f of frames) {
    const idx = applyPalette(f.data, palette.slice(0, T), "rgb565");
    const out = new Uint8Array(idx.length);
    for (let i = 0; i < idx.length; i++) {
      const clear = f.data[i * 4 + 3] < 128;
      out[i] = clear ? T : prev && prev[i] === idx[i] ? T : idx[i];
      if (clear) idx[i] = T;
    }
    gif.writeFrame(out, width, height, { palette, delay: FRAME_MS, transparent: true, transparentIndex: T, dispose: 1, repeat: 0 });
    prev = idx;
  }
  gif.finish();
  return gif.bytes();
};

for (const name of panels) {
  await page.goto(base + name + ".html");
  await page.evaluate(() => window.panelReady);
  const shot = page.locator("#shot");
  if (ANIMATED.has(name)) {
    const n = await page.evaluate(() => window.frameCount);
    const frames = [];
    for (let i = 0; i < n; i++) {
      await page.evaluate((k) => window.setFrame(k), i);
      frames.push(PNG.sync.read(await shot.screenshot({ omitBackground: true })));
    }
    const bytes = encodeGif(frames);
    writeFileSync(join(OUT, name + ".gif"), bytes);
    console.log(`${name}.gif  ${frames[0].width}x${frames[0].height}  ${n} frames  ${(bytes.length / 1024).toFixed(0)} KB`);
  } else {
    const buf = await shot.screenshot({ omitBackground: true });
    writeFileSync(join(OUT, name + ".png"), buf);
    console.log(`${name}.png  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}
await browser.close();
server.close();

// README.md from the template, plus the flow diagram SVGs.
const { copy, data } = TBX;
const txt = (k) => (copy[k] === "NONE" ? "" : !copy[k] || copy[k] === "TODO" ? `TODO: ${k}` : copy[k].replace(/\n\s*\n/g, "\n\n"));
const oneLine = (k) => txt(k).replace(/\s+/g, " ").trim();
const cell = (s) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const skillPath = (name) => data.router.some((s) => s.name === name)
  ? `plugins/tinderbox/skills/${name}/SKILL.md` : `skills/${name}/SKILL.md`;
const link = (name) => `[${name}](${skillPath(name)})`;

const readDescription = (file) => {
  const fm = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/)[1];
  const m = fm.match(/^description:[ \t]*(.*(?:\n[ \t]+.*)*)/m);
  return m ? m[1].replace(/^(>-?|\|-?)\s*/, "").replace(/\s+/g, " ").replace(/^["']|["']$/g, "").trim() : "";
};
const upstreamDesc = (src, name) => {
  const [owner, repo] = src.source.replace(/\/$/, "").split("/").slice(-2);
  const sub = (JSON.parse(readFileSync(join(ROOT, "upstream/sources.json"), "utf8")).skills
    .find((s) => s.source === src.source).skills.find((k) => k.name === name) || {}).path;
  // The pinned clone install.sh keeps, else the installed copy of the same pin.
  for (const f of [join(process.env.HOME, ".local/share/tinderbox/sources", `${repo}-${owner}`, sub || "", "SKILL.md"),
    join(process.env.HOME, ".agents/skills", name, "SKILL.md")]) {
    try { return readDescription(f); } catch {}
  }
  return "";
};

// Which part of tinderbox enforces each default. Keys match readme/copy.md.
const ENFORCED = {
  "default-deliver": link("delivery"),
  "default-evidence": link("visual-qa"),
  "default-worktrees": link("delivery"),
  "default-identity": "[router/core.md](router/core.md)",
  "default-followthrough": link("pr-follow-through"),
  "default-asked": link("delivery"),
  "default-versions": "[Context7](https://github.com/upstash/context7)",
};
const defaults = "| default | enforced by |\n| --- | --- |\n" + Object.keys(copy).filter((k) => k.startsWith("default-"))
  .map((k) => { const [title, ...rest] = oneLine(k).split(":"); const line = rest.join(":").trim();
    return `| **${cell(title)}**${line ? `<br>${cell(line)}` : ""} | ${ENFORCED[k] || ""} |`; }).join("\n");

// Flow layers: names only; the captions sit under the diagram as text.
const kits = data.pinned.filter((s) => !/tstack/i.test(s.name)).flatMap((s) => s.skills);
const LAYERS = [
  { name: "always loaded", nodes: ["CLAUDE.md", "AGENTS.md", "pstack-models.md"].map((name) => ({ name, kind: "own" })) },
  { name: "router", hub: { name: "delivery", kind: "own" },
    nodes: data.router.map((s) => s.name).filter((n) => n !== "delivery").map((name) => ({ name, kind: "own" })) },
  { name: "method", nodes: [{ name: "pstack playbooks", kind: "ps" }, { name: "tstack", kind: "up" },
    ...data.own.map((s) => ({ name: s.name, kind: "own" }))] },
  { name: "domain kits", nodes: kits.map((name) => ({ name, kind: "up" })) },
];
for (const theme of ["dark", "light"]) writeFileSync(join(OUT, `flow-${theme}.svg`), flowSvg(ROOT, LAYERS, theme));
console.log("flow-dark.svg, flow-light.svg");

const short = (s) => s.name.replace("Theo Browne's ", "").replace(" agent skills", "");
const repoLink = (s) => `[${s.source.replace("https://github.com/", "")}](${s.source})`;
const inside = [
  "| | skills |", "| --- | --: |",
  `| **mine** · [skills/](skills) | ${data.own.length} |`,
  `| **tinderbox plugin** · [plugins/tinderbox/](plugins/tinderbox) | ${data.router.length} |`,
  ...data.pinned.map((s) => { const n = data.modified.filter((m) => m.from === s.name).length;
    return `| **${short(s)}** · ${repoLink(s)} @ \`${s.pin.slice(0, 7)}\`${n ? `, ${n} modified` : ""} | ${s.skills.length} |`; }),
  `| **pstack** · [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack) @ \`${data.pstack.pin.slice(0, 7)}\` | ${data.pstack.skills.length} |`,
  `| **total** | **${data.counts.total}** |`,
].join("\n");

const table = (title, rows) => `**${title}**\n\n| skill | what it does |\n| --- | --- |\n` + rows.map(([n, d]) => `| ${n} | ${cell(d || "")} |`).join("\n");
const tables = [
  table("mine", data.own.map((s) => [link(s.name), s.description])),
  ...(data.modified.length ? [table("mine, modified from upstream", data.modified.map((s) => {
    const src = data.pinned.find((p) => p.name === s.from);
    return [`${link(s.name)} · from ${short(src)}`, s.description];
  }))] : []),
  table("tinderbox plugin", data.router.map((s) => [link(s.name), s.description])),
  ...data.pinned.map((s) => table(`${short(s)} (${s.license.replace("see upstream LICENSE", "upstream license")})`, s.skills.map((n) =>
    data.modified.some((m) => m.name === n) ? [`${link(n)} · modified`, upstreamDesc(s, n)] : [`\`${n}\``, upstreamDesc(s, n)]))),
  `**pstack ${data.pstack.version}** (MIT)\n\n` + data.pstack.skills.map((n) => `\`${n}\``).join(" "),
].join("\n\n");

const vars = {
  ...Object.fromEntries(Object.keys(copy).map((k) => [k, txt(k)])),
  "defaults-table": defaults,
  "inside-table": inside,
  "skill-tables": tables,
  "flow-alt": flowAlt(LAYERS),
  "count-total": String(data.counts.total),
  "count-mine": String(data.counts.own + data.counts.router),
  "count-pinned": String(data.counts.pinned),
  "count-pstack": String(data.counts.pstack),
  "manual": data.manual.map((m) => m.replace(/ \(.*\)$/, "")).join(" and "),
};
const readme = readFileSync(join(HERE, "README.template.md"), "utf8")
  .replace(/\{\{([\w-]+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`))
  .replace(/\n{3,}/g, "\n\n");
writeFileSync(join(ROOT, "README.md"), readme);
console.log("README.md");
