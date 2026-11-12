// Shared helpers for the visual-polish-loop scripts: finding Playwright,
// reading the config, putting a page into a state, running scripted actions,
// and small utilities. No dependencies beyond Playwright.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

// ------------------------------------------------------------ arguments

// --key value, --key=value and bare --flag (true). Positional args go in _.
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const eq = a.indexOf('=');
    if (eq > 0) { out[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { out[key] = next; i++; } else out[key] = true;
  }
  return out;
}

export const list = (v) => (v === undefined || v === true ? null : String(v).split(',').map((s) => s.trim()).filter(Boolean));

// ------------------------------------------------------------ Playwright

// The project's own Playwright first (so versions match its tests), then any
// global install, then the bundle inside a global @playwright/cli install.
export function loadPlaywright() {
  const tries = [];
  const fromCwd = createRequire(join(process.cwd(), 'package.json'));
  for (const name of ['playwright', '@playwright/test', 'playwright-core']) tries.push(() => fromCwd(name));
  let globalRoot = '';
  try { globalRoot = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
  const globals = [
    process.env.PLAYWRIGHT_PATH,
    globalRoot && join(globalRoot, 'playwright'),
    globalRoot && join(globalRoot, '@playwright/cli/node_modules/playwright'),
    join(process.env.HOME || '', '.local/lib/node_modules/@playwright/cli/node_modules/playwright'),
    join(process.env.HOME || '', '.local/lib/node_modules/playwright'),
  ].filter(Boolean);
  for (const p of globals) tries.push(() => createRequire(import.meta.url)(p));
  for (const t of tries) {
    try { const pw = t(); if (pw && pw.chromium) return pw; } catch {}
  }
  throw new Error('Playwright not found. Install it in the project (e.g. `pnpm add -D playwright`) or set PLAYWRIGHT_PATH to a playwright package directory.');
}

export async function launch() {
  const { chromium } = loadPlaywright();
  // Installed Chrome renders fonts and colour like users see; fall back to the bundled Chromium.
  try { return await chromium.launch({ channel: 'chrome', headless: true }); } catch {}
  return chromium.launch({ headless: true });
}

// ------------------------------------------------------------ config

// See assets/config.example.json for the full shape.
export function loadConfig(args) {
  const path = args.config || '.agent-artifacts/visual-polish/config.json';
  if (!existsSync(path)) throw new Error(`No config at ${path}. Copy assets/config.example.json from the skill and edit it.`);
  const config = JSON.parse(readFileSync(path, 'utf8'));
  config._dir = dirname(resolve(path));
  config.out = resolve(config._dir, config.out || '.');
  if (args.base) config.baseUrl = args.base;
  if (!config.baseUrl) throw new Error('config.baseUrl is required (or pass --base).');
  config.routes = (config.routes || [{ name: 'home', path: '/' }]).map((r) => (typeof r === 'string' ? { name: slug(r), path: r } : r));
  config.states = config.states && config.states.length ? config.states : [{ name: 'default' }];
  config.viewports = (config.viewports && config.viewports.length ? config.viewports : [{ name: 'desktop', width: 1440, height: 900 }]);
  return config;
}

// Files named in the config are relative to the config's folder.
export const fromConfig = (config, p) => (p ? (isAbsolute(p) ? p : resolve(config._dir, p)) : p);

export function pick(items, wanted) {
  const names = list(wanted);
  if (!names) return items;
  const out = items.filter((i) => names.includes(i.name));
  const missing = names.filter((n) => !items.some((i) => i.name === n));
  if (missing.length) throw new Error(`Unknown name(s): ${missing.join(', ')}. Known: ${items.map((i) => i.name).join(', ')}`);
  return out;
}

export function slug(s) {
  return String(s).replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[._-]+|[._-]+$/g, '').toLowerCase() || 'home';
}

export function routeUrl(baseUrl, path, query) {
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
  if (query) for (const [k, v] of new URLSearchParams(query)) url.searchParams.set(k, v);
  return url.toString();
}

// ------------------------------------------------------------ states

// A context that already looks like the state: colour scheme, motion,
// stored login, cookies, local storage, injected CSS, hidden elements.
export async function newStateContext(browser, config, state, viewport, extra = {}) {
  const storageState = fromConfig(config, state.storageState || config.storageState);
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height || 900 },
    deviceScaleFactor: extra.dpr || viewport.dpr || 1,
    isMobile: !!viewport.mobile,
    hasTouch: !!viewport.mobile,
    colorScheme: state.colorScheme || config.colorScheme || 'no-preference',
    reducedMotion: state.reducedMotion ? 'reduce' : (config.reducedMotion ? 'reduce' : 'no-preference'),
    ...(storageState && existsSync(storageState) ? { storageState } : {}),
  });
  if (state.cookies && state.cookies.length) {
    const url = new URL(config.baseUrl);
    await context.addCookies(state.cookies.map((c) => ({ path: '/', domain: url.hostname, ...c })));
  }
  const local = { ...(config.localStorage || {}), ...(state.localStorage || {}) };
  if (Object.keys(local).length) {
    await context.addInitScript((items) => { try { for (const [k, v] of Object.entries(items)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch {} }, local);
  }
  let css = '';
  const hide = [...(config.hide || []), ...(state.hide || []), ...(extra.hide || [])];
  if (hide.length) css += `${hide.join(',\n')} { visibility: hidden !important; }\n`;
  if (config.freezeAnimations !== false && extra.freeze !== false) {
    // Captures should be repeatable: stop caret blinks, transitions and looping animations.
    css += '*, *::before, *::after { caret-color: transparent !important; transition-duration: 0s !important; transition-delay: 0s !important; }\n';
  }
  for (const file of [config.css, state.css, extra.css].filter(Boolean)) css += readFileSync(fromConfig(config, file), 'utf8') + '\n';
  if (css) {
    await context.addInitScript((text) => {
      const add = () => { const s = document.createElement('style'); s.setAttribute('data-visual-polish', ''); s.textContent = text; (document.head || document.documentElement).appendChild(s); };
      if (document.head) add(); else document.addEventListener('DOMContentLoaded', add, { once: true });
    }, css);
  }
  if (state.init) await context.addInitScript(state.init);
  return context;
}

// Open a route in a state: optional first visit (for cookie-setting URLs),
// load, wait for fonts and network, run the route's and state's actions.
export async function openRoute(page, config, state, route) {
  const errors = [];
  const onError = (e) => errors.push(`pageerror: ${e.message}`);
  const onConsole = (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`); };
  const onResponse = (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(0, 200)}`); };
  page.on('pageerror', onError); page.on('console', onConsole); page.on('response', onResponse);
  try {
    if (state.firstVisit && !page.__visited?.has(state.name)) {
      await page.goto(routeUrl(config.baseUrl, state.firstVisit), { waitUntil: 'load' });
      (page.__visited ||= new Set()).add(state.name);
    }
    await page.goto(routeUrl(config.baseUrl, route.path, state.query || route.query), { waitUntil: 'load', timeout: 60000 });
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await runActions(page, config, [...(state.actions || []), ...(route.actions || [])]);
    await page.waitForTimeout(route.wait ?? state.wait ?? config.waitMs ?? 800);
  } finally {
    page.off('pageerror', onError); page.off('console', onConsole); page.off('response', onResponse);
  }
  return errors;
}

// Steps: { goto }, { click }, { hover }, { fill: [selector, text] }, { press },
// { wait: ms }, { waitFor: selector }, { eval: "js" }, { scroll: y },
// { select: [selector, value] }, { check: selector }.
export async function runActions(page, config, steps = []) {
  for (const step of steps) {
    const [kind, arg] = Object.entries(step)[0] || [];
    switch (kind) {
      case 'goto': await page.goto(routeUrl(config.baseUrl, arg), { waitUntil: 'load' }); break;
      case 'click': await page.locator(arg).first().click({ timeout: 10000 }); break;
      case 'hover': await page.locator(arg).first().hover({ timeout: 10000 }); break;
      case 'fill': await page.locator(arg[0]).first().fill(String(arg[1]), { timeout: 10000 }); break;
      case 'select': await page.locator(arg[0]).first().selectOption(arg[1]); break;
      case 'check': await page.locator(arg).first().check(); break;
      case 'press': await page.keyboard.press(arg); break;
      case 'wait': await page.waitForTimeout(Number(arg)); break;
      case 'waitFor': await page.locator(arg).first().waitFor({ timeout: 15000 }); break;
      case 'eval': await page.evaluate(arg); break;
      case 'scroll': await page.evaluate((y) => window.scrollTo(0, y), Number(arg)); break;
      default: if (kind) throw new Error(`Unknown action ${kind}`);
    }
  }
}

// App shells often scroll an inner panel (a `h-screen` layout with an
// `overflow-y-auto` main) instead of the page, so full-page shots and audits
// only see the first screen. Let that panel and its ancestors grow to their
// content, plus any selectors listed in config.expand.
export async function expandScrollers(page, config) {
  return page.evaluate((extra) => {
    const grow = (el) => {
      for (let a = el; a && a !== document.documentElement.parentNode; a = a.parentElement) {
        a.style.setProperty('height', 'auto', 'important');
        a.style.setProperty('max-height', 'none', 'important');
        a.style.setProperty('overflow', 'visible', 'important');
      }
    };
    for (const sel of extra || []) document.querySelectorAll(sel).forEach(grow);
    const doc = document.documentElement;
    if (doc.scrollHeight > innerHeight + 4) return null;
    let best = null;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY)) continue;
      if (el.scrollHeight - el.clientHeight < 40 || el.clientHeight < innerHeight * 0.4) continue;
      if (!best || el.scrollHeight > best.scrollHeight) best = el;
    }
    if (!best) return null;
    const label = best.tagName.toLowerCase() + (best.id ? '#' + best.id : '') + (typeof best.className === 'string' && best.className ? '.' + best.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    grow(best);
    return label;
  }, config.expand || []);
}

// ------------------------------------------------------------ files

export function ensureDir(p) { mkdirSync(p, { recursive: true }); return p; }
export function writeJSON(p, data) { ensureDir(dirname(p)); writeFileSync(p, JSON.stringify(data, null, 1)); }
export function pngSize(buffer) { return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }; }

// Minimal PNG decoder for screenshots (8-bit, non-interlaced, grey/RGB/RGBA).
// Returns { width, height, channels, data } where data is raw bytes.
export async function decodePng(buffer) {
  const { inflateSync } = await import('node:zlib');
  let pos = 8; let width = 0; let height = 0; let depth = 0; let type = 0; let interlace = 0;
  const idat = [];
  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos); const kind = buffer.toString('latin1', pos + 4, pos + 8);
    const body = buffer.subarray(pos + 8, pos + 8 + len);
    if (kind === 'IHDR') { width = body.readUInt32BE(0); height = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (kind === 'IDAT') idat.push(body);
    else if (kind === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[type];
  if (depth !== 8 || !channels || interlace) throw new Error(`Unsupported PNG (depth ${depth}, type ${type}, interlace ${interlace})`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels; const data = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]; const src = y * (stride + 1) + 1; const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? data[dst + x - channels] : 0;
      const b = y > 0 ? data[dst - stride + x] : 0;
      const c = x >= channels && y > 0 ? data[dst - stride + x - channels] : 0;
      const v = raw[src + x];
      let out;
      if (f === 0) out = v; else if (f === 1) out = v + a; else if (f === 2) out = v + b; else if (f === 3) out = v + ((a + b) >> 1);
      else { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); out = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      data[dst + x] = out & 255;
    }
  }
  return { width, height, channels, data };
}

export function pixel(img, x, y) {
  const i = (Math.max(0, Math.min(img.height - 1, y)) * img.width + Math.max(0, Math.min(img.width - 1, x))) * img.channels;
  if (img.channels >= 3) return [img.data[i], img.data[i + 1], img.data[i + 2]];
  return [img.data[i], img.data[i], img.data[i]];
}

// ------------------------------------------------------------ colour (Node side)

// Any CSS colour the scripts meet in source: hex, rgb(a), hsl(a), oklch,
// oklab, and bare shadcn-style HSL triplets ("222.2 47.4% 11.2%").
// Returns [r, g, b, a] with r,g,b in 0..255, or null.
export function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  let m;
  if ((m = s.match(/^#([0-9a-f]{3,8})$/))) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const nums = (str) => str.replace(/[,/]/g, ' ').split(/\s+/).filter(Boolean);
  const alpha = (v) => (v === undefined ? 1 : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
  if ((m = s.match(/^rgba?\(([^)]+)\)$/))) {
    const p = nums(m[1]);
    const ch = (v) => (v.endsWith('%') ? parseFloat(v) * 2.55 : parseFloat(v));
    return [ch(p[0]), ch(p[1]), ch(p[2]), alpha(p[3])];
  }
  const hsl = (h, sat, l, a) => {
    h = ((h % 360) + 360) % 360; sat /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const f = (n) => l - sat * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0) * 255, f(8) * 255, f(4) * 255, a];
  };
  if ((m = s.match(/^hsla?\(([^)]+)\)$/))) {
    const p = nums(m[1]);
    return hsl(parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2]), alpha(p[3]));
  }
  if ((m = s.match(/^(-?[\d.]+)(deg)?\s+([\d.]+)%\s+([\d.]+)%(\s*\/\s*([\d.]+%?))?$/))) {
    return hsl(parseFloat(m[1]), parseFloat(m[3]), parseFloat(m[4]), alpha(m[6]));
  }
  if ((m = s.match(/^okl(ch|ab)\(([^)]+)\)$/))) {
    const p = nums(m[2]);
    let L = p[0].endsWith('%') ? parseFloat(p[0]) / 100 : parseFloat(p[0]);
    let a; let b;
    if (m[1] === 'ch') {
      const C = p[1].endsWith('%') ? parseFloat(p[1]) * 0.004 : parseFloat(p[1]);
      const H = (parseFloat(p[2]) * Math.PI) / 180;
      a = C * Math.cos(H); b = C * Math.sin(H);
    } else {
      a = p[1].endsWith('%') ? parseFloat(p[1]) * 0.004 : parseFloat(p[1]);
      b = p[2].endsWith('%') ? parseFloat(p[2]) * 0.004 : parseFloat(p[2]);
    }
    return [...oklabToSrgb(L, a, b), alpha(p[3])];
  }
  return null;
}

const toLinear = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const fromLinear = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const clamp255 = (v) => Math.max(0, Math.min(255, v));

export function srgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

export function oklabToSrgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp255(fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp255(fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp255(fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}

export function oklch(rgb) {
  const [L, a, b] = srgbToOklab(rgb);
  const C = Math.hypot(a, b);
  const H = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { L, C, H };
}

export const deltaE = (x, y) => { const a = srgbToOklab(x); const b = srgbToOklab(y); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
export const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(clamp255(v)).toString(16).padStart(2, '0')).join('');

// A rough family name from OKLCH, for grouping ("8 golds and 11 reds").
export function family(rgb) {
  const { L, C, H } = oklch(rgb);
  if (C < 0.035) return L > 0.93 ? 'white' : L < 0.18 ? 'black' : 'neutral';
  const names = [[20, 'pink'], [45, 'red'], [70, 'orange'], [110, 'gold'], [135, 'yellow-green'], [175, 'green'], [215, 'teal'], [245, 'cyan'], [285, 'blue'], [320, 'violet'], [350, 'magenta'], [361, 'pink']];
  // Low-chroma colours near a hue read as tinted neutrals ("warm grey", "cool grey").
  if (C < 0.07) return H > 40 && H < 120 ? 'warm-neutral' : H > 180 && H < 300 ? 'cool-neutral' : 'tinted-neutral';
  for (const [limit, name] of names) if (H < limit) return name;
  return 'pink';
}

// WCAG 2 relative luminance and contrast, and APCA Lc (0.0.98G-4g), for
// light-on-dark themes where WCAG 2 overstates dark-colour contrast.
export function luminance([r, g, b]) { return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b); }
export function wcag(fg, bg) { const a = luminance(fg); const b = luminance(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
export function apca(fg, bg) {
  const y = ([r, g, b]) => { let v = 0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4; if (v < 0.022) v += (0.022 - v) ** 1.414; return v; };
  const yt = y(fg); const yb = y(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) { const s = (yb ** 0.56 - yt ** 0.57) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14; return s > -0.1 ? 0 : (s + 0.027) * 100;
}
export const over = (top, under) => { const a = top[3] ?? 1; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)); };

export function quantile(sorted, q) { if (!sorted.length) return null; return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))]; }
