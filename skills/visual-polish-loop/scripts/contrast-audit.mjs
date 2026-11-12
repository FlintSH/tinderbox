#!/usr/bin/env node
// Text contrast for every visible piece of text on every route, measured
// against the pixels actually behind it: the page is shot with all text made
// transparent, then each text's line boxes are sampled. Gradients, images,
// translucent panels and modern colour formats are all handled the same way.
// Reports WCAG 2 ratios (AA: 4.5, or 3 for large text) and APCA Lc, which is
// fairer to light-on-dark themes.
//
// usage: node contrast-audit.mjs --tag before [--config path] [--states a,b]
//        [--viewports desktop|all] [--routes a,b] [--css proto.css]
//        node contrast-audit.mjs --compare before.json after.json
// writes: <out>/metrics/contrast-<tag>.json and .txt
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { apca, decodePng, expandScrollers, hex, launch, loadConfig, newStateContext, openRoute, over, parseArgs, pick, pixel, quantile, slug, wcag, writeJSON } from './lib.mjs';

const args = parseArgs();

if (args.compare) {
  compare(String(args.compare), args._[0]);
  process.exit(0);
}
if (!args.tag) { console.error('usage: node contrast-audit.mjs --tag <name> [--config path] [--states a,b] [--viewports a|all] [--routes a,b] [--css file]\n       node contrast-audit.mjs --compare before.json after.json'); process.exit(2); }

const config = loadConfig(args);
const tag = slug(args.tag);
const states = pick(config.states, args.states);
const viewports = args.viewports === 'all' ? config.viewports : args.viewports ? pick(config.viewports, args.viewports) : [config.viewports[0]];
const routes = pick(config.routes, args.routes);
const audit = config.audit || {};
const ignore = ['script', 'style', 'noscript', 'template', 'svg', 'canvas', 'iframe', 'object', ...(audit.ignore || [])].join(', ');
const HIDE_TEXT = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }
::placeholder { color: transparent !important; } html { scroll-behavior: auto !important; }`;

const rows = [];
const browser = await launch();
try {
  for (const state of states) {
    for (const viewport of viewports) {
      const context = await newStateContext(browser, config, state, viewport, { css: args.css, hide: audit.hide || [], dpr: 1 });
      const page = await context.newPage();
      for (const route of routes) {
        const where = { route: route.name, state: state.name, viewport: viewport.name };
        try {
          await openRoute(page, config, state, route);
          await expandScrollers(page, config);
          const found = await page.evaluate(collect, ignore);
          await page.addStyleTag({ content: HIDE_TEXT });
          const vh = viewport.height || 900;
          const docHeight = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0));
          const limit = Number(config.maxPageHeight || 16000);
          for (let y = 0; y < Math.min(docHeight, limit); y += Math.round(vh * 0.85)) {
            await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
            await page.waitForTimeout(120);
            const todo = await page.evaluate(chunk, vh);
            if (!todo.length) continue;
            const img = await decodePng(await page.screenshot({ animations: 'disabled', caret: 'hide' }));
            const done = [];
            for (const t of todo) {
              const it = found[t.i];
              const samples = [];
              for (const r of t.rects) {
                const nx = Math.max(2, Math.min(16, Math.round(r.w / 6)));
                const ny = Math.max(2, Math.min(5, Math.round(r.h / 4)));
                for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) samples.push(pixel(img, Math.round(r.x + ((a + 0.5) * r.w) / nx), Math.round(r.y + ((b + 0.5) * r.h) / ny)));
              }
              const scored = samples.map((bg) => { const fg = over(it.fg, bg); return { bg, fg, ratio: wcag(fg, bg) }; }).sort((p, q) => p.ratio - q.ratio);
              const worst = quantile(scored, 0.1);
              const mid = quantile(scored, 0.5);
              rows.push({
                ...where, kind: it.kind, selector: it.selector, text: it.text, size: it.size, weight: it.weight, large: it.large,
                threshold: it.large ? 3 : 4.5, ratio: round(worst.ratio), median: round(mid.ratio), apca: Math.round(Math.abs(apca(worst.fg, worst.bg))),
                fg: hex(worst.fg), bg: hex(worst.bg), opacity: it.opacity, exempt: it.disabled ? 'disabled' : null,
              });
              done.push(t.i);
            }
            await page.evaluate((ids) => { for (const i of ids) window.__vp.items[i].done = true; }, done);
          }
          const left = await page.evaluate(() => window.__vp.items.map((it, i) => (it.done ? null : { i, reason: it.unmeasured || (it.covered ? 'covered' : 'offscreen') })).filter(Boolean));
          for (const l of left) rows.push({ ...where, kind: found[l.i].kind, selector: found[l.i].selector, text: found[l.i].text, size: found[l.i].size, unmeasured: l.reason });
          const measured = rows.filter((r) => r.route === route.name && r.state === state.name && r.viewport === viewport.name && r.ratio !== undefined);
          console.log(`${state.name}/${viewport.name}/${route.name}: ${measured.length} text(s) measured${left.length ? `, ${left.length} not measured` : ''}`);
        } catch (err) {
          console.log(`${state.name}/${viewport.name}/${route.name}: FAILED ${String(err.message || err).slice(0, 300)}`);
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const summaries = summarize(rows);
const outJson = join(config.out, 'metrics', `contrast-${tag}.json`);
writeJSON(outJson, { tag, generatedAt: new Date().toISOString(), css: args.css || null, summaries, rows });
const text = report(summaries, rows);
writeFileSync(outJson.replace(/\.json$/, '.txt'), text);
console.log('\n' + text + `\nwrote ${outJson}`);

// ------------------------------------------------------------ in-page

// Every element with its own text (or an empty field's placeholder): its
// resolved text colour (any CSS colour, via a 1px canvas), effective opacity,
// size and weight. Stored on window.__vp for the chunk passes.
function collect(ignoreSel) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const norm = (s) => {
    if (cache.has(s)) return cache.get(s);
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data; const v = [d[0], d[1], d[2], d[3] / 255]; cache.set(s, v); return v;
  };
  const part = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const selector = (el) => { const p = el.parentElement; return (p && p !== document.body ? part(p).slice(0, 50) + ' > ' : '') + part(el).slice(0, 70); };
  const items = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest(ignoreSel)) continue;
    const texts = [...el.childNodes].filter((n) => n.nodeType === 3 && /[\p{L}\p{N}]/u.test(n.textContent));
    const placeholder = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.placeholder && !el.value;
    if (!texts.length && !placeholder) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible' || cs.display === 'none' || el.getClientRects().length === 0) continue; // not rendered (e.g. inside a closed dialog)
    let opacity = 1;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) opacity *= parseFloat(getComputedStyle(a).opacity);
    if (opacity < 0.05) continue;
    const size = parseFloat(cs.fontSize); const weight = parseInt(cs.fontWeight, 10) || 400;
    let fg = norm(placeholder ? getComputedStyle(el, '::placeholder').color : cs.color);
    let unmeasured = null;
    if (!placeholder && cs.webkitTextFillColor) {
      const fill = norm(cs.webkitTextFillColor);
      if (fill[3] === 0) unmeasured = 'gradient-or-clipped-text'; else fg = fill;
    }
    items.push({
      el, texts, placeholder, kind: placeholder ? 'placeholder' : 'text', fg: [fg[0], fg[1], fg[2], fg[3] * opacity], opacity: Math.round(opacity * 100) / 100,
      size, weight, large: size >= 24 || (size >= 18.66 && weight >= 700), disabled: !!el.closest(':disabled, [aria-disabled="true"]'),
      text: (placeholder ? el.placeholder : texts.map((t) => t.textContent).join(' ')).replace(/\s+/g, ' ').trim().slice(0, 60),
      selector: selector(el), unmeasured, done: false, covered: 0,
    });
  }
  window.__vp = { items };
  return items.map(({ el, texts, ...rest }) => rest);
}

// For the current scroll position: the line boxes of each unmeasured text
// that's fully on screen and not covered by something else.
function chunk(viewH) {
  const out = [];
  window.__vp.items.forEach((it, i) => {
    if (it.done || it.unmeasured) return;
    let rects = [];
    if (it.placeholder) {
      const r = it.el.getBoundingClientRect(); const cs = getComputedStyle(it.el);
      if (r.width < 2 || r.height < 2) { it.done = true; it.unmeasured = 'no-box'; return; }
      const pl = parseFloat(cs.paddingLeft); const pt = parseFloat(cs.paddingTop);
      rects = [{ x: r.left + pl, y: r.top + pt, w: Math.max(4, r.width - pl - parseFloat(cs.paddingRight)), h: Math.max(4, Math.min(r.height - pt - parseFloat(cs.paddingBottom), it.size * 1.3)) }];
    } else {
      for (const t of it.texts) {
        const range = document.createRange(); range.selectNodeContents(t);
        for (const r of range.getClientRects()) if (r.width > 0.5 && r.height > 0.5) rects.push({ x: r.left, y: r.top, w: r.width, h: r.height });
        if (rects.length > 24) break;
      }
    }
    if (!rects.length) { it.done = true; it.unmeasured = 'no-box'; return; }
    const inside = rects.filter((r) => r.y >= 0 && r.y + r.h <= viewH && r.x + r.w > 0 && r.x < innerWidth);
    if (!inside.length) return;
    const r0 = inside[0];
    const hit = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r0.x + r0.w / 2)), r0.y + r0.h / 2);
    // Text is hit-tested as its own element; only an element that ignores the
    // pointer lets the hit fall through to an ancestor.
    const passThrough = getComputedStyle(it.el).pointerEvents === 'none';
    if (!(hit && (hit === it.el || it.el.contains(hit) || (passThrough && hit.contains(it.el))))) { it.covered++; return; }
    out.push({ i, rects: inside.slice(0, 12).map((r) => ({ x: Math.max(0, r.x), y: r.y, w: Math.min(r.w, innerWidth - Math.max(0, r.x)), h: r.h })) });
  });
  return out;
}

// ------------------------------------------------------------ reporting

function round(v) { return Math.round(v * 100) / 100; }

function summarize(all) {
  const groups = new Map();
  for (const r of all) {
    const key = `${r.state} / ${r.viewport}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return [...groups].map(([key, rs]) => {
    const m = rs.filter((r) => r.ratio !== undefined);
    const ratios = m.map((r) => r.ratio).sort((a, b) => a - b);
    const lcs = m.filter((r) => !r.large).map((r) => r.apca).sort((a, b) => a - b);
    const unmeasured = {};
    for (const r of rs.filter((x) => x.unmeasured)) unmeasured[r.unmeasured] = (unmeasured[r.unmeasured] || 0) + 1;
    return {
      group: key, measured: m.length, unmeasured,
      min: ratios[0] ?? null, p10: quantile(ratios, 0.1), median: quantile(ratios, 0.5),
      failing: m.filter((r) => !r.exempt && r.ratio < r.threshold).length,
      apcaMedianBody: quantile(lcs, 0.5), apcaWeakBody: lcs.filter((v) => v < 60).length,
    };
  });
}

function report(sums, all) {
  const lines = [];
  for (const s of sums) {
    const um = Object.entries(s.unmeasured).map(([k, v]) => `${k} ${v}`).join(', ');
    lines.push(`${s.group}: ${s.measured} texts, min ${s.min}, p10 ${s.p10}, median ${s.median}, below AA ${s.failing}; APCA body median Lc ${s.apcaMedianBody}, body under Lc 60: ${s.apcaWeakBody}${um ? `; not measured: ${um}` : ''}`);
    const worst = all.filter((r) => `${r.state} / ${r.viewport}` === s.group && r.ratio !== undefined && !r.exempt).sort((a, b) => a.ratio / a.threshold - b.ratio / b.threshold).slice(0, 15);
    for (const r of worst) lines.push(`  ${r.ratio < r.threshold ? 'FAIL' : '    '} ${String(r.ratio).padEnd(5)} (Lc ${String(r.apca).padStart(3)}) ${r.route.padEnd(14)} ${r.fg} on ${r.bg} ${r.size}px/${r.weight} ${JSON.stringify(r.text).slice(0, 40)}  ${r.selector.slice(0, 70)}`);
  }
  return lines.join('\n') + '\n';
}

function compare(aPath, bPath) {
  const a = JSON.parse(readFileSync(aPath, 'utf8')); const b = JSON.parse(readFileSync(bPath, 'utf8'));
  console.log(`contrast: ${a.tag} -> ${b.tag}`);
  for (const sb of b.summaries) {
    const sa = a.summaries.find((s) => s.group === sb.group) || {};
    console.log(`${sb.group}: texts ${sa.measured} -> ${sb.measured}, min ${sa.min} -> ${sb.min}, p10 ${sa.p10} -> ${sb.p10}, median ${sa.median} -> ${sb.median}, below AA ${sa.failing} -> ${sb.failing}, APCA body median ${sa.apcaMedianBody} -> ${sb.apcaMedianBody}`);
  }
  const key = (r) => `${r.state}|${r.viewport}|${r.route}|${r.selector}|${r.text}`;
  const before = new Map(a.rows.filter((r) => r.ratio !== undefined).map((r) => [key(r), r]));
  const pairs = b.rows.filter((r) => r.ratio !== undefined && before.has(key(r))).map((r) => ({ r, was: before.get(key(r)) }));
  const worse = pairs.filter((p) => p.r.ratio < p.was.ratio - 0.3).sort((x, y) => (x.r.ratio - x.was.ratio) - (y.r.ratio - y.was.ratio));
  const newFails = pairs.filter((p) => !p.r.exempt && p.r.ratio < p.r.threshold && p.was.ratio >= p.was.threshold);
  console.log(`matched ${pairs.length} texts: ${pairs.filter((p) => p.r.ratio > p.was.ratio + 0.3).length} better, ${worse.length} worse, ${newFails.length} newly below AA`);
  for (const p of worse.slice(0, 20)) console.log(`  ${p.was.ratio} -> ${p.r.ratio} ${p.r.state}/${p.r.route} ${p.was.fg}/${p.was.bg} -> ${p.r.fg}/${p.r.bg} ${JSON.stringify(p.r.text).slice(0, 40)} ${p.r.selector.slice(0, 60)}`);
}
