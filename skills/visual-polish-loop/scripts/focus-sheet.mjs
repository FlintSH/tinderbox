#!/usr/bin/env node
// Keyboard focus, checked stop by stop: tab through each route, crop every
// focused element at 2x, and compare it with the same element unfocused.
// Flags stops with no visible change (no focus indicator) and weak ones
// (the changed pixels contrast under 3:1 with what they replaced, the
// WCAG 2.2 focus-appearance yardstick). Builds a board of all stops.
//
// usage: node focus-sheet.mjs --tag before [--config path] [--routes a,b]
//        [--states a] [--viewports a] [--tabs 30]
// writes: <out>/shots/<tag>/focus/<state>-<viewport>/<route>-NN.png,
//         <out>/sheets/<tag>/focus-<state>-<viewport>.png, <out>/metrics/focus-<tag>.json
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodePng, ensureDir, launch, loadConfig, newStateContext, openRoute, parseArgs, pick, slug, wcag, writeJSON } from './lib.mjs';

const args = parseArgs();
if (!args.tag) { console.error('usage: node focus-sheet.mjs --tag <name> [--routes a,b] [--states a] [--viewports a] [--tabs 30]'); process.exit(2); }
const config = loadConfig(args);
const tag = slug(args.tag);
const states = pick(config.states, args.states);
const viewports = args.viewports ? pick(config.viewports, args.viewports) : [config.viewports[0]];
const routes = pick(config.routes, args.routes);
const TABS = Number(args.tabs || 30);
const results = [];

const browser = await launch();
try {
  for (const state of states) for (const viewport of viewports) {
    const dir = ensureDir(join(config.out, 'shots', tag, 'focus', `${slug(state.name)}-${slug(viewport.name)}`));
    const context = await newStateContext(browser, config, state, viewport, { dpr: 2 });
    const page = await context.newPage();
    const stops = [];
    for (const route of routes) {
      try {
        await openRoute(page, config, state, route);
        await page.mouse.move(viewport.width - 2, (viewport.height || 900) - 2);
        await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); window.scrollTo(0, 0); });
        let first = null;
        for (let n = 1; n <= TABS; n++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(140);
          const info = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body || el === document.documentElement) return null;
            el.scrollIntoView({ block: 'center', inline: 'nearest' });
            const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
            const part = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
            if (!window.__vpFocusIds) window.__vpFocusIds = new WeakMap();
            if (!window.__vpFocusIds.has(el)) window.__vpFocusIds.set(el, window.__vpFocusIds.size + 1 + Math.random());
            return { id: window.__vpFocusIds.get(el), selector: part(el).slice(0, 80), text: (el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 40), x: r.x, y: r.y, w: r.width, h: r.height, outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, shadow: cs.boxShadow === 'none' ? '' : cs.boxShadow.slice(0, 80) };
          });
          if (!info) continue;
          if (first === null) first = info.id; else if (info.id === first) break; // wrapped around
          await page.waitForTimeout(120);
          const box = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
          const pad = 10; const vw = viewport.width; const vh = viewport.height || 900;
          const x = Math.max(0, box.x - pad); const y = Math.max(0, box.y - pad);
          const clip = { x, y, width: Math.min(vw - x, box.w + pad * 2), height: Math.min(vh - y, box.h + pad * 2) };
          if (clip.width < 4 || clip.height < 4) continue;
          const focused = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
          await page.evaluate(() => { window.__vpLast = document.activeElement; document.activeElement.blur(); });
          await page.waitForTimeout(120);
          const plain = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
          await page.evaluate(() => { if (window.__vpLast) window.__vpLast.focus({ preventScroll: true }); });
          const verdict = await judge(focused, plain);
          const file = join(dir, `${slug(route.name)}-${String(n).padStart(2, '0')}.png`);
          writeFileSync(file, focused);
          stops.push({ route: route.name, n, ...info, ...verdict, file });
        }
        const mine = stops.filter((s) => s.route === route.name);
        console.log(`${state.name}/${viewport.name}/${route.name}: ${mine.length} stop(s), ${mine.filter((s) => s.flag === 'none').length} without a visible focus, ${mine.filter((s) => s.flag === 'weak').length} weak`);
      } catch (err) { console.log(`${state.name}/${viewport.name}/${route.name}: FAILED ${String(err.message || err).slice(0, 200)}`); }
    }
    await context.close();
    results.push({ state: state.name, viewport: viewport.name, stops });
    if (stops.length) await board(stops, join(ensureDir(join(config.out, 'sheets', tag)), `focus-${slug(state.name)}-${slug(viewport.name)}.png`), `${tag} · focus · ${state.name} · ${viewport.name}`);
  }
} finally {
  await browser.close();
}
writeJSON(join(config.out, 'metrics', `focus-${tag}.json`), { tag, generatedAt: new Date().toISOString(), results });
for (const r of results) for (const s of r.stops.filter((x) => x.flag)) console.log(`  ${s.flag === 'none' ? 'NO FOCUS' : 'weak    '} ${r.state}/${s.route} #${s.n} ${s.selector} ${JSON.stringify(s.text)} change contrast ${s.change ?? '-'}`);

// How much the element's pixels change when focused, and how strongly.
async function judge(aBuf, bBuf) {
  const a = await decodePng(aBuf); const b = await decodePng(bBuf);
  if (a.width !== b.width || a.height !== b.height) return { changed: 1, change: null, flag: null };
  let changed = 0; const ratios = []; const px = a.width * a.height;
  for (let i = 0; i < px; i++) {
    const o = i * a.channels; const q = i * b.channels;
    const pa = [a.data[o], a.data[o + 1], a.data[o + 2]]; const pb = [b.data[q], b.data[q + 1], b.data[q + 2]];
    if (Math.max(Math.abs(pa[0] - pb[0]), Math.abs(pa[1] - pb[1]), Math.abs(pa[2] - pb[2])) > 24) { changed++; if (ratios.length < 4000) ratios.push(wcag(pa, pb)); }
  }
  ratios.sort((x, y) => x - y);
  const frac = changed / px; const change = ratios.length ? Math.round(ratios[Math.floor(ratios.length / 2)] * 100) / 100 : null;
  return { changed: Math.round(frac * 1000) / 1000, change, flag: frac < 0.004 ? 'none' : change !== null && change < 3 ? 'weak' : null };
}

async function board(stops, file, title) {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#1b1b1f;color:#eee;font:11px/1.3 ui-monospace,Menlo,monospace}.h{padding:8px 10px;background:#2a2a30;font-size:13px}
.w{display:flex;flex-wrap:wrap;gap:12px;padding:12px;align-items:flex-start;width:1576px}.c{max-width:760px}.l{padding:4px 6px;background:#2a2a30}.bad{background:#7a1f24}.weak{background:#6b5314}img{display:block;max-width:760px;background:#000}</style>
<div class="h">${esc(title)}: ${stops.length} stops, ${stops.filter((s) => s.flag === 'none').length} without visible focus, ${stops.filter((s) => s.flag === 'weak').length} weak</div><div class="w">` +
    stops.map((s) => `<div class="c"><div class="l ${s.flag === 'none' ? 'bad' : s.flag === 'weak' ? 'weak' : ''}">${esc(s.route)} #${s.n} ${s.flag === 'none' ? 'NO VISIBLE FOCUS' : s.flag === 'weak' ? `WEAK (${s.change}:1)` : `${s.change ?? '-'}:1`} · ${esc(s.selector.slice(0, 50))}</div><img src="${pathToFileURL(s.file).href}" style="width:${Math.min(760, Math.round(s.w + 20))}px"></div>`).join('') + '</div>';
  const htmlFile = file.replace(/\.png$/, '.html');
  writeFileSync(htmlFile, html);
  const page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
  await page.goto(pathToFileURL(htmlFile).href);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  console.log(file);
}
