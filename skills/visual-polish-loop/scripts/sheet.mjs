#!/usr/bin/env node
// Review sheets from captures (capture.mjs), rendered to PNG so any reviewer
// (human or model) can look at them. Pairs and crops stay at 1:1, because
// shrinking hides exactly the details a polish pass is about.
//
//   grid    --tag T                 overview: every route as a thumbnail, per state/viewport
//   pairs   --a before --b r1       A over B (or side by side when narrow), cut into screen-height tiles
//   compare --tags a,b,c            directions side by side, top of each page, per route/state/viewport
//   crops   --tag T                 every 2x detail crop on boards
// common: [--config path] [--states a,b] [--viewports a] [--routes a,b] [--max-tiles 6]
// writes: <out>/sheets/...
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ensureDir, launch, loadConfig, parseArgs, pick, pngSize, slug } from './lib.mjs';

const args = parseArgs();
const mode = args._[0];
if (!['grid', 'pairs', 'compare', 'crops'].includes(mode)) {
  console.error('usage: node sheet.mjs grid --tag T | pairs --a A --b B | compare --tags A,B,C | crops --tag T  [--states] [--viewports] [--routes]');
  process.exit(2);
}
const config = loadConfig(args);
const states = pick(config.states, args.states);
const viewports = pick(config.viewports, args.viewports);
const routes = pick(config.routes, args.routes);
const shot = (tag, s, v, r) => join(config.out, 'shots', slug(tag), slug(s.name), slug(v.name), `${slug(r.name)}.png`);
const size = (file) => pngSize(readFileSync(file).subarray(0, 32));
const url = (file) => pathToFileURL(file).href;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CSS = `body{margin:0;background:#1b1b1f;color:#e8e8ea;font:13px/1.35 ui-monospace,Menlo,Consolas,monospace}
.lbl{padding:6px 8px;background:#2a2a30;color:#f0f0f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile{background-repeat:no-repeat;image-rendering:auto}`;

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
let written = 0;

async function render(html, out, width) {
  const htmlFile = out.replace(/\.png$/, '.html');
  writeFileSync(htmlFile, `<!doctype html><meta charset="utf-8"><style>${CSS}</style>${html}`);
  await page.setViewportSize({ width: Math.ceil(width), height: 800 });
  await page.goto(url(htmlFile), { waitUntil: 'load' });
  await page.screenshot({ path: out, fullPage: true });
  written++;
}

try {
  if (mode === 'grid') {
    const tag = need('tag');
    for (const s of states) for (const v of viewports) {
      const cells = routes.map((r) => ({ r, f: shot(tag, s, v, r) })).filter((c) => existsSync(c.f));
      if (!cells.length) continue;
      const thumbW = v.width >= 900 ? 360 : 200; const scale = thumbW / v.width; const clipH = Math.round((v.height || 900) * 2.2 * scale);
      const cols = Math.max(1, Math.min(cells.length, Math.floor(2200 / (thumbW + 12))));
      const html = `<div class="lbl">${esc(tag)} · ${esc(s.name)} · ${esc(v.name)}</div><div style="display:grid;grid-template-columns:repeat(${cols},${thumbW}px);gap:12px;padding:12px">` +
        cells.map((c) => `<div><div class="lbl">${esc(c.r.name)}</div><div style="width:${thumbW}px;height:${clipH}px;overflow:hidden;background:#000"><img src="${url(c.f)}" style="width:${thumbW}px;display:block"></div></div>`).join('') + '</div>';
      const out = join(ensureDir(join(config.out, 'sheets', slug(tag))), `grid-${slug(s.name)}-${slug(v.name)}.png`);
      await render(html, out, cols * (thumbW + 12) + 12);
      console.log(out);
    }
  }

  if (mode === 'pairs') {
    const a = need('a'); const b = need('b'); const maxTiles = Number(args['max-tiles'] || 6);
    const dir = ensureDir(join(config.out, 'sheets', `${slug(a)}-vs-${slug(b)}`));
    for (const s of states) for (const v of viewports) for (const r of routes) {
      const fa = shot(a, s, v, r); const fb = shot(b, s, v, r);
      if (!existsSync(fa) || !existsSync(fb)) continue;
      const sa = size(fa); const sb = size(fb); const H = Number(args.tile || v.height || 900);
      const tiles = Math.min(maxTiles, Math.ceil(Math.max(sa.height, sb.height) / H));
      const stacked = v.width >= 900;
      for (let k = 0; k < tiles; k++) {
        const part = (f, sz, label) => {
          const h = Math.max(0, Math.min(H, sz.height - k * H));
          return `<div style="width:${v.width}px"><div class="lbl">${esc(label)} · ${esc(r.name)} · ${esc(s.name)} · ${esc(v.name)} · ${k + 1}/${tiles}</div>` +
            (h ? `<div class="tile" style="width:${v.width}px;height:${h}px;background-image:url('${url(f)}');background-position:0 -${k * H}px"></div>` : '<div class="lbl">(page ends above)</div>') + '</div>';
        };
        const html = `<div style="display:flex;flex-direction:${stacked ? 'column' : 'row'};gap:10px;padding:10px">${part(fa, sa, a)}${part(fb, sb, b)}</div>`;
        const out = join(dir, `${slug(s.name)}-${slug(v.name)}-${slug(r.name)}-${k + 1}.png`);
        await render(html, out, stacked ? v.width + 20 : v.width * 2 + 30);
      }
    }
    console.log(`${written} pair tile(s) in ${dir}`);
  }

  if (mode === 'compare') {
    const tags = (need('tags')).split(',').map((t) => t.trim()).filter(Boolean);
    const dir = ensureDir(join(config.out, 'sheets', `compare-${tags.map(slug).join('-')}`.slice(0, 120)));
    for (const s of states) for (const v of viewports) for (const r of routes) {
      const cells = tags.map((t) => ({ t, f: shot(t, s, v, r) })).filter((c) => existsSync(c.f));
      if (cells.length < 2) continue;
      const colW = Math.min(v.width, Math.floor(Number(args.width || 2400) / cells.length));
      const scale = colW / v.width; const H = Math.round(Number(args.height || v.height || 900) * scale);
      const html = `<div style="display:flex;gap:10px;padding:10px">` + cells.map((c) => `<div style="width:${colW}px"><div class="lbl">${esc(c.t)} · ${esc(r.name)} · ${esc(s.name)}</div><div style="width:${colW}px;height:${H}px;overflow:hidden"><img src="${url(c.f)}" style="width:${colW}px;display:block"></div></div>`).join('') + '</div>';
      const out = join(dir, `${slug(s.name)}-${slug(v.name)}-${slug(r.name)}.png`);
      await render(html, out, cells.length * (colW + 10) + 10);
    }
    console.log(`${written} comparison sheet(s) in ${dir}`);
  }

  if (mode === 'crops') {
    const tag = need('tag');
    const indexFile = join(config.out, 'shots', slug(tag), 'index.json');
    const index = JSON.parse(readFileSync(indexFile, 'utf8'));
    for (const s of states) for (const v of viewports) {
      const crops = index.items.filter((i) => i.state === s.name && i.viewport === v.name && routes.some((r) => r.name === i.route)).flatMap((i) => (i.crops || []).map((c) => ({ ...c, route: i.route })));
      if (!crops.length) continue;
      const boardW = 1600; const boards = [];
      let current = []; let rowW = 0; let rowH = 0; let height = 0;
      for (const c of crops) {
        const sz = size(c.file); const w = Math.min(sz.width, boardW - 24); const h = Math.round(sz.height * (w / sz.width)) + 26;
        if (rowW + w + 12 > boardW) { height += rowH + 12; rowW = 0; rowH = 0; }
        if (height + h > 2400 && current.length) { boards.push(current); current = []; height = 0; rowW = 0; rowH = 0; }
        current.push({ ...c, w }); rowW += w + 12; rowH = Math.max(rowH, h);
      }
      if (current.length) boards.push(current);
      for (let n = 0; n < boards.length; n++) {
        const html = `<div class="lbl">${esc(tag)} · crops · ${esc(s.name)} · ${esc(v.name)} · ${n + 1}/${boards.length}</div><div style="display:flex;flex-wrap:wrap;gap:12px;padding:12px;align-items:flex-start;width:${boardW - 24}px">` +
          boards[n].map((c) => `<div style="width:${c.w}px"><div class="lbl" style="font-size:11px">${esc(c.name)}</div><img src="${url(c.file)}" style="width:${c.w}px;display:block;background:#000"></div>`).join('') + '</div>';
        const out = join(ensureDir(join(config.out, 'sheets', slug(tag))), `crops-${slug(s.name)}-${slug(v.name)}-${n + 1}.png`);
        await render(html, out, boardW);
        console.log(out);
      }
    }
  }
} finally {
  await browser.close();
}

function need(key) {
  if (!args[key] || args[key] === true) { console.error(`--${key} is required for ${mode}`); process.exit(2); }
  return String(args[key]);
}
