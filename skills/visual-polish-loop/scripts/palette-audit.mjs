#!/usr/bin/env node
// The palette, measured two ways:
//   static   what the source declares: colour literals (hex, rgb, hsl, oklch...),
//            CSS custom properties, Tailwind palette and arbitrary-colour classes.
//            Finds near-duplicate tints, too many variants per hue, hardcoded
//            literals outside the token files, mixed Tailwind neutral families.
//   runtime  what the rendered pages actually show, by role (surfaces, text,
//            borders, icons, shadows, gradients) weighted by on-screen area,
//            plus a palette card PNG for the audit and the PR.
//
// usage: node palette-audit.mjs static [--src app,components,lib] [--tag before] [--config path]
//        node palette-audit.mjs runtime --tag before [--config path] [--states a] [--routes a,b] [--css proto.css]
// writes: <out>/metrics/palette-static-<tag>.{json,md}, <out>/metrics/palette-<tag>.{json,md,png}
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deltaE, ensureDir, family, hex, launch, list, loadConfig, newStateContext, oklch, openRoute, expandScrollers, parseArgs, parseColor, pick, slug, writeJSON } from './lib.mjs';

const args = parseArgs();
const mode = args._[0];
if (!['static', 'runtime'].includes(mode)) { console.error('usage: node palette-audit.mjs static [--src dirs] [--tag t] | runtime --tag t [--states] [--routes] [--css file]'); process.exit(2); }
let config;
try { config = loadConfig(args); } catch (err) { if (mode === 'runtime') throw err; config = { out: resolve('.agent-artifacts/visual-polish'), _dir: process.cwd() }; }
const tag = slug(args.tag || (mode === 'static' ? 'current' : ''));
const metrics = ensureDir(join(config.out, 'metrics'));
const THRESH = Number(args.threshold || 0.03); // OKLab distance: under ~0.02 is hard to tell apart side by side

if (mode === 'static') await staticAudit(); else await runtimeAudit();

// ------------------------------------------------------------ clustering

// Greedy clustering, most-used colour first: anything within THRESH of a
// cluster's lead joins it. Returns clusters sorted by weight.
function cluster(colors) {
  const sorted = [...colors].sort((a, b) => b.weight - a.weight);
  const out = [];
  for (const c of sorted) {
    const home = out.find((k) => k.alpha === c.alpha && deltaE(k.rgb, c.rgb) < THRESH);
    if (home) { home.members.push(c); home.weight += c.weight; } else out.push({ rgb: c.rgb, hex: c.hex, alpha: c.alpha, family: family(c.rgb), members: [c], weight: c.weight });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

function familyTable(clusters) {
  const fams = {};
  for (const k of clusters) {
    const f = (fams[k.family] ||= { family: k.family, clusters: 0, values: 0, weight: 0, leads: [] });
    f.clusters++; f.values += k.members.length; f.weight += k.weight; if (f.leads.length < 8) f.leads.push(k.hex);
  }
  return Object.values(fams).sort((a, b) => b.weight - a.weight);
}

function lc(rgb) { const { L, C, H } = oklch(rgb); return `L ${L.toFixed(2)} C ${C.toFixed(3)} H ${Math.round(H)}`; }

// ------------------------------------------------------------ static

async function staticAudit() {
  const roots = (list(args.src) || config.src || ['.']).map((p) => resolve(p));
  const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage', 'vendor', '.agent-artifacts', '.turbo', '.vercel', '.svelte-kit', '.nuxt', '.cache', 'storybook-static']);
  const EXT = new Set(['.css', '.scss', '.sass', '.less', '.pcss', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.vue', '.svelte', '.astro', '.html', '.ejs', '.hbs', '.njk', '.mdx', '.json']);
  const files = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.storybook') { if (SKIP.has(e.name) || e.isDirectory()) continue; }
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p); continue; }
      if (!EXT.has(extname(e.name)) || /\.min\.|\.map$|lock|\.d\.ts$|^package(-lock)?\.json$|tsconfig/.test(e.name)) continue;
      try { if (statSync(p).size > 600000) continue; } catch { continue; }
      files.push(p);
    }
  };
  for (const r of roots) { try { statSync(r).isDirectory() ? walk(r) : files.push(r); } catch {} }

  const HEX = /(^|[\s:(,'"`=[{>])(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))(?![0-9a-zA-Z_-])/g;
  const FUNC = /\b(?:rgba?|hsla?|oklch|oklab)\([^()]*(?:\([^()]*\)[^()]*)*\)/g;
  const VAR_DEF = /(--[\w-]+)\s*:\s*([^;{}]+?)\s*(?:;|}|$)/g;
  const TW_PALETTE = /(?<![\w-])(bg|text|border(?:-[trblxy])?|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-(50|[1-9]00|950))?(?:\/(\d{1,3}))?(?![\w-])/g;
  const TW_ARBITRARY = /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|divide|placeholder|caret|accent)-\[([^\]\s]+)\]/g;
  const TW_TOKEN = /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|placeholder)-(background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring)(?:-foreground)?(?:\/(\d{1,3}))?(?![\w-])/g;

  const literals = []; const tokens = []; const tw = {}; const twArb = []; let tokenClassUses = 0; let varRefs = 0;
  for (const file of files) {
    const rel = relative(process.cwd(), file);
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, n) => {
      if (line.length > 3000) return; // minified or data lines
      const defs = [...line.matchAll(VAR_DEF)];
      for (const d of defs) {
        const rgb = parseColor(d[2]);
        if (rgb) tokens.push({ name: d[1], value: d[2].trim(), hex: hex(rgb), alpha: rgb[3], file: rel, line: n + 1 });
      }
      const isDef = defs.length > 0;
      const add = (value, kind) => {
        const rgb = parseColor(value);
        if (!rgb) return;
        literals.push({ value, kind, rgb: rgb.slice(0, 3), alpha: rgb[3], hex: hex(rgb), file: rel, line: n + 1, token: isDef });
      };
      for (const m of line.matchAll(HEX)) {
        const rest = line.slice(m.index + m[0].length);
        if (/\.(css|scss|less)$/.test(file) && /^[^;{}]*\{/.test(rest)) continue; // an id selector, not a colour
        add(m[2], 'hex');
      }
      for (const m of line.matchAll(FUNC)) { if (/var\(/.test(m[0])) { varRefs++; continue; } add(m[0], 'function'); }
      for (const m of line.matchAll(TW_PALETTE)) {
        const key = `${m[2]}${m[3] ? '-' + m[3] : ''}`; const fam = m[2];
        const t = (tw[fam] ||= { family: fam, uses: 0, shades: {} }); t.uses++; t.shades[key] = (t.shades[key] || 0) + 1;
      }
      for (const m of line.matchAll(TW_ARBITRARY)) { const rgb = parseColor(m[1].replace(/_/g, ' ')); if (rgb) { twArb.push({ value: m[0], hex: hex(rgb), file: rel, line: n + 1 }); literals.push({ value: m[1], kind: 'tailwind-arbitrary', rgb: rgb.slice(0, 3), alpha: rgb[3], hex: hex(rgb), file: rel, line: n + 1, token: false }); } }
      tokenClassUses += [...line.matchAll(TW_TOKEN)].length;
    });
  }

  const byHex = new Map();
  for (const l of literals) {
    const c = byHex.get(l.hex) || { hex: l.hex, rgb: l.rgb, weight: 0, alphas: new Set(), files: new Set() };
    c.weight++; c.alphas.add(Math.round(l.alpha * 100) / 100); c.files.add(l.file); byHex.set(l.hex, c);
  }
  const clusters = cluster([...byHex.values()]);
  const fams = familyTable(clusters);
  const outside = {};
  for (const l of literals.filter((x) => !x.token)) outside[l.file] = (outside[l.file] || 0) + 1;
  const neutralFamilies = Object.keys(tw).filter((f) => ['slate', 'gray', 'zinc', 'neutral', 'stone'].includes(f));

  const result = {
    tag, roots: roots.map((r) => relative(process.cwd(), r) || '.'), files: files.length, literals: literals.length,
    distinct: byHex.size, clusters: clusters.length, tokenDefinitions: tokens.length, tokenClassUses, varRefs,
    families: fams, nearDuplicates: clusters.filter((k) => k.members.length > 1).map((k) => ({ lead: k.hex, family: k.family, members: k.members.map((m) => m.hex), uses: k.weight })),
    alphaVariants: [...byHex.values()].filter((c) => c.alphas.size > 2).map((c) => ({ hex: c.hex, alphas: [...c.alphas].sort() })),
    outsideTokens: Object.entries(outside).sort((a, b) => b[1] - a[1]).map(([file, count]) => ({ file, count })),
    tailwind: { families: Object.values(tw).sort((a, b) => b.uses - a.uses), neutralFamilies, arbitrary: twArb },
    tokens,
  };
  writeJSON(join(metrics, `palette-static-${tag}.json`), result);
  const md = [
    `# Palette (static, ${tag})`, '',
    `${files.length} files scanned in ${result.roots.join(', ')}: ${literals.length} colour literals, ${byHex.size} distinct values in ${clusters.length} clusters (OKLab distance < ${THRESH}).`,
    `${tokens.length} colour custom properties defined; ${tokenClassUses} semantic token classes (bg-primary, text-muted-foreground...); ${varRefs} colour functions built on var().`, '',
    '## Families (clusters / distinct values / uses)', '',
    ...fams.map((f) => `- ${f.family}: ${f.clusters} / ${f.values} / ${f.weight}  ${f.leads.join(' ')}`), '',
    '## Near-duplicates (probably meant to be one colour)', '',
    ...(result.nearDuplicates.length ? result.nearDuplicates.slice(0, 40).map((d) => `- ${d.family}: ${d.members.join(', ')} (${d.uses} uses)`) : ['- none']), '',
    '## Hardcoded literals outside custom-property definitions (top files)', '',
    ...(result.outsideTokens.length ? result.outsideTokens.slice(0, 25).map((o) => `- ${o.file}: ${o.count}`) : ['- none']), '',
    '## Tailwind palette classes', '',
    ...(result.tailwind.families.length ? result.tailwind.families.map((f) => `- ${f.family}: ${f.uses} uses (${Object.entries(f.shades).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(', ')})`) : ['- none']),
    ...(neutralFamilies.length > 1 ? ['', `Mixed neutral families: ${neutralFamilies.join(', ')}. Pick one.`] : []),
    ...(twArb.length ? ['', `${twArb.length} arbitrary colour classes, e.g. ${twArb.slice(0, 6).map((a) => `${a.value} (${a.file}:${a.line})`).join(', ')}`] : []), '',
    '## Colour custom properties', '',
    ...tokens.slice(0, 120).map((t) => `- ${t.name}: ${t.value} → ${t.hex}${t.alpha < 1 ? ` @${t.alpha}` : ''} (${t.file}:${t.line})`),
  ].join('\n');
  writeFileSync(join(metrics, `palette-static-${tag}.md`), md + '\n');
  console.log(md.split('\n').slice(0, 40).join('\n'));
  console.log(`\nwrote ${join(metrics, `palette-static-${tag}.md`)}`);
}

// ------------------------------------------------------------ runtime

async function runtimeAudit() {
  if (!args.tag) { console.error('--tag is required for runtime'); process.exit(2); }
  const states = pick(config.states, args.states);
  const viewport = args.viewports ? pick(config.viewports, args.viewports)[0] : config.viewports[0];
  const routes = pick(config.routes, args.routes);
  const browser = await launch();
  const groups = [];
  try {
    for (const state of states) {
      const context = await newStateContext(browser, config, state, viewport, { css: args.css, hide: (config.audit && config.audit.hide) || [] });
      const page = await context.newPage();
      const bag = new Map();
      for (const route of routes) {
        try {
          await openRoute(page, config, state, route);
          await expandScrollers(page, config);
          const found = await page.evaluate(harvest);
          for (const [k, w] of Object.entries(found)) bag.set(k, (bag.get(k) || 0) + w);
          console.log(`${state.name}/${route.name}: ${Object.keys(found).length} colour/role pairs`);
        } catch (err) { console.log(`${state.name}/${route.name}: FAILED ${String(err.message || err).slice(0, 200)}`); }
      }
      await context.close();
      // bag keys: "role|r,g,b,alpha" (alpha in steps of 0.05, so a 5% tint isn't mistaken for a solid colour)
      const roles = {};
      for (const [k, w] of bag) {
        const [role, rgbStr] = k.split('|'); const [r, g, b, a] = rgbStr.split(',').map(Number);
        (roles[role] ||= []).push({ rgb: [r, g, b], hex: hex([r, g, b]), alpha: a, weight: w });
      }
      const byRole = Object.fromEntries(Object.entries(roles).map(([role, colors]) => {
        const total = colors.reduce((s, c) => s + c.weight, 0);
        return [role, cluster(colors).map((k) => ({ hex: k.hex, alpha: k.alpha, label: k.hex + (k.alpha < 1 ? ` @${k.alpha}` : ''), family: k.family, share: k.weight / total, members: k.members.length, lc: lc(k.rgb) }))];
      }));
      const all = cluster(Object.values(roles).flat());
      groups.push({ state: state.name, viewport: viewport.name, clusters: all.length, families: familyTable(all), byRole });
    }
    writeJSON(join(metrics, `palette-${tag}.json`), { tag, generatedAt: new Date().toISOString(), css: args.css || null, groups });
    const md = groups.map((g) => [
      `# Palette on screen (${tag}, ${g.state}/${g.viewport})`, '', `${g.clusters} distinct colour clusters across roles.`, '',
      '## Families', '', ...g.families.map((f) => `- ${f.family}: ${f.clusters} clusters, ${f.values} values  ${f.leads.join(' ')}`), '',
      ...Object.entries(g.byRole).flatMap(([role, ks]) => [`## ${role}`, '', ...ks.filter((k) => k.share >= 0.005).slice(0, 14).map((k) => `- ${k.label} ${(k.share * 100).toFixed(1)}% ${k.family} (${k.lc})${k.members > 1 ? `, ${k.members} near-identical values` : ''}`), '']),
    ].join('\n')).join('\n\n');
    writeFileSync(join(metrics, `palette-${tag}.md`), md + '\n');
    await card(browser, groups, join(metrics, `palette-${tag}.png`));
    console.log(md.split('\n').slice(0, 50).join('\n'));
    console.log(`\nwrote ${join(metrics, `palette-${tag}.md`)} and palette-${tag}.png`);
  } finally {
    await browser.close();
  }
}

// In the page: every visible element's colours by role, weighted by roughly
// how much of the screen they cover. Colours are resolved through a 1px canvas,
// so any CSS colour format comes back as sRGB.
function harvest() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const norm = (s) => { if (cache.has(s)) return cache.get(s); cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; const v = d[3] < 13 ? null : `${d[0]},${d[1]},${d[2]},${Math.max(0.05, Math.round((d[3] / 255) * 20) / 20)}`; cache.set(s, v); return v; };
  const out = {};
  const add = (role, color, w) => { if (!color || !(w > 0)) return; const c = norm(color); if (c) out[`${role}|${c}`] = (out[`${role}|${c}`] || 0) + w; };
  const COLOR_RE = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;
  const docW = document.documentElement.scrollWidth; const docH = document.documentElement.scrollHeight;
  for (const el of document.querySelectorAll('body, body *')) {
    if (el.closest('script, style, noscript, template')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility !== 'visible' || parseFloat(cs.opacity) < 0.05) continue;
    const r = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right + scrollX, docW) - Math.max(r.left + scrollX, 0));
    const h = Math.max(0, Math.min(r.bottom + scrollY, docH) - Math.max(r.top + scrollY, 0));
    if (w < 1 || h < 1) continue;
    const area = w * h;
    const tag = el.tagName.toLowerCase();
    if (['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'use'].includes(tag)) {
      if (cs.fill && cs.fill !== 'none' && !cs.fill.startsWith('url')) add('icons', cs.fill, area);
      if (cs.stroke && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0) add('icons', cs.stroke, (w + h) * 2 * parseFloat(cs.strokeWidth));
      continue;
    }
    if (tag === 'svg') continue;
    add('surfaces', cs.backgroundColor, area);
    if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/url\(/.test(cs.backgroundImage)) {
      const stops = cs.backgroundImage.match(COLOR_RE) || [];
      for (const s of stops) add('gradients', s, area / stops.length);
    }
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const bw = parseFloat(cs[`border${side}Width`]);
      if (bw > 0 && cs[`border${side}Style`] !== 'none') add('borders', cs[`border${side}Color`], (side === 'Top' || side === 'Bottom' ? w : h) * bw);
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') for (const s of cs.boxShadow.match(COLOR_RE) || []) add('shadows', s, (w + h) * 2);
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
    if (own) { const fs = parseFloat(cs.fontSize); add('text', cs.webkitTextFillColor && norm(cs.webkitTextFillColor) ? cs.webkitTextFillColor : cs.color, own.length * fs * fs * 0.5); }
  }
  return out;
}

async function card(browser, groups, file) {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const order = ['surfaces', 'text', 'borders', 'icons', 'gradients', 'shadows'];
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#16161a;color:#e9e9ec;font:12px/1.35 ui-monospace,Menlo,monospace}
.g{padding:16px 18px;border-bottom:1px solid #333}.h{font-size:14px;margin-bottom:10px}.row{display:flex;gap:14px;margin:8px 0;align-items:flex-start}.role{width:90px;color:#aaa;padding-top:12px}
.sws{display:flex;flex-wrap:wrap;gap:6px}.sw{display:flex;flex-direction:column;gap:3px}.chip{height:38px;border-radius:4px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.t{font-size:11px;color:#bbb}</style>` +
    groups.map((g) => `<div class="g"><div class="h">${esc(tag)} · ${esc(g.state)} · ${g.clusters} colour clusters</div>` +
      order.filter((r) => g.byRole[r]).map((role) => `<div class="row"><div class="role">${role}</div><div class="sws">` +
        g.byRole[role].filter((k) => k.share >= 0.01).slice(0, 12).map((k) => { const rgba = k.alpha < 1 ? `rgba(${parseInt(k.hex.slice(1, 3), 16)},${parseInt(k.hex.slice(3, 5), 16)},${parseInt(k.hex.slice(5, 7), 16)},${k.alpha})` : k.hex; return `<div class="sw" style="width:${Math.max(56, Math.round(k.share * 900))}px"><div class="chip" style="background:linear-gradient(${rgba},${rgba}),repeating-conic-gradient(#3a3a3e 0% 25%,#232326 0% 50%) 0 0/12px 12px"></div><div class="t">${k.label} ${(k.share * 100).toFixed(0)}%${k.members > 1 ? ` ×${k.members}` : ''}</div></div>`; }).join('') +
        '</div></div>').join('') + '</div>').join('');
  const htmlFile = file.replace(/\.png$/, '.html');
  writeFileSync(htmlFile, html);
  const page = await browser.newPage({ viewport: { width: 1200, height: 600 } });
  await page.goto(pathToFileURL(htmlFile).href);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}
