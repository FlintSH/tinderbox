#!/usr/bin/env node
// Capture every route in every state and viewport from the config, full page,
// plus 2x detail crops of named elements (config crops) and of common
// components (config autoCrops). Optionally injects a prototype stylesheet,
// so directions can be tried on the real pages without editing source.
//
// usage: node capture.mjs --tag before [--config path] [--states a,b]
//        [--viewports desktop] [--routes home,settings] [--css proto.css]
//        [--no-crops] [--viewport-only]
// writes: <out>/shots/<tag>/<state>/<viewport>/<route>.png
//         <out>/shots/<tag>/<state>/<viewport>/crops/<route>--<crop>.png
//         <out>/shots/<tag>/index.json (pages, sizes, console errors, failed requests)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, expandScrollers, launch, loadConfig, newStateContext, openRoute, parseArgs, pick, pngSize, slug, writeJSON } from './lib.mjs';

const args = parseArgs();
if (!args.tag) { console.error('usage: node capture.mjs --tag <name> [--config path] [--states a,b] [--viewports a] [--routes a,b] [--css file]'); process.exit(2); }
const config = loadConfig(args);
const tag = slug(args.tag);
const states = pick(config.states, args.states);
const viewports = pick(config.viewports, args.viewports);
const routes = pick(config.routes, args.routes);
const MAX_HEIGHT = Number(config.maxPageHeight || 16000);
const autoCrops = Array.isArray(config.autoCrops) ? { selectors: config.autoCrops } : (config.autoCrops || null);
const wantCrops = !args['no-crops'] && (autoCrops || (config.crops || []).length || routes.some((r) => (r.crops || []).length));
const root = join(config.out, 'shots', tag);
const index = { tag, capturedAt: new Date().toISOString(), baseUrl: config.baseUrl, css: args.css || null, items: [] };

const browser = await launch();
try {
  for (const state of states) {
    for (const viewport of viewports) {
      const dir = ensureDir(join(root, slug(state.name), slug(viewport.name)));
      const context = await newStateContext(browser, config, state, viewport, { css: args.css });
      const page = await context.newPage();
      for (const route of routes) {
        const item = { route: route.name, state: state.name, viewport: viewport.name, file: null, errors: [] };
        try {
          item.errors = await openRoute(page, config, state, route);
          if (!args['viewport-only'] && route.fullPage !== false) {
            const grown = await expandScrollers(page, config);
            if (grown) { item.expanded = grown; await page.waitForTimeout(150); }
          }
          const height = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0));
          const mask = [...(config.mask || []), ...(route.mask || [])].map((s) => page.locator(s));
          const opts = { animations: 'disabled', mask, maskColor: config.maskColor || '#7f7f7f', caret: 'hide' };
          let buffer;
          if (args['viewport-only'] || route.fullPage === false) buffer = await page.screenshot(opts);
          else if (height > MAX_HEIGHT) { buffer = await page.screenshot({ ...opts, fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height: MAX_HEIGHT } }); item.truncated = height; }
          else buffer = await page.screenshot({ ...opts, fullPage: true });
          const file = join(dir, `${slug(route.name)}.png`);
          writeFileSync(file, buffer);
          Object.assign(item, { file, ...pngSize(buffer) });
          console.log(`${state.name}/${viewport.name}/${route.name}: ${item.width}x${item.height}${item.truncated ? ` (page is ${item.truncated}px, cut at ${MAX_HEIGHT})` : ''}${item.errors.length ? `, ${item.errors.length} error(s)` : ''}`);
        } catch (err) {
          item.failed = String(err.message || err).slice(0, 400);
          console.log(`${state.name}/${viewport.name}/${route.name}: FAILED ${item.failed}`);
        }
        index.items.push(item);
      }
      await context.close();

      if (!wantCrops) continue;
      // Detail crops at 2x in their own context, so page shots stay at 1x.
      const cropDir = ensureDir(join(dir, 'crops'));
      const hi = await newStateContext(browser, config, state, viewport, { css: args.css, dpr: 2 });
      const cpage = await hi.newPage();
      for (const route of routes) {
        const item = index.items.find((i) => i.route === route.name && i.state === state.name && i.viewport === viewport.name);
        if (!item || item.failed) continue;
        item.crops = [];
        try {
          await openRoute(cpage, config, state, route);
          const named = [...(config.crops || []), ...(route.crops || [])].map((c) => ({ max: 1, ...c }));
          const auto = autoCrops ? autoCrops.selectors.map((s) => ({ name: slug(s), selector: s, max: autoCrops.maxPerSelector || 4, auto: true })) : [];
          const seen = [];
          for (const crop of [...named, ...auto]) {
            const handles = await cpage.locator(crop.selector).all().catch(() => []);
            let taken = 0;
            for (let n = 0; n < handles.length && taken < crop.max; n++) {
              if (crop.nth !== undefined && n !== crop.nth) continue;
              const el = handles[n];
              if (!(await el.isVisible().catch(() => false))) continue;
              await el.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
              const box = await el.boundingBox();
              const min = autoCrops?.minSize || 10;
              if (!box || box.width < min || box.height < min) continue;
              // Skip near-duplicates (the same spot already cropped by another selector).
              if (seen.some((s) => Math.abs(s.x - box.x) < 4 && Math.abs(s.y - box.y) < 4 && Math.abs(s.w - box.width) < 4)) continue;
              const pad = crop.pad ?? 12;
              const vw = viewport.width; const vh = viewport.height || 900;
              const x = Math.max(0, box.x - pad); const y = Math.max(0, box.y - pad);
              const clip = { x, y, width: Math.min(vw - x, box.width + pad * 2), height: Math.min(vh - y, box.height + pad * 2) };
              if (clip.width < 4 || clip.height < 4) continue;
              seen.push({ x: box.x, y: box.y, w: box.width });
              const name = `${slug(route.name)}--${slug(crop.name || crop.selector)}${crop.max > 1 ? `-${taken + 1}` : ''}`;
              const file = join(cropDir, `${name}.png`);
              await cpage.screenshot({ path: file, clip, animations: 'disabled', caret: 'hide' });
              item.crops.push({ name, selector: crop.selector, file, auto: !!crop.auto });
              taken++;
            }
          }
          if (item.crops.length) console.log(`${state.name}/${viewport.name}/${route.name}: ${item.crops.length} crop(s)`);
        } catch (err) {
          console.log(`${state.name}/${viewport.name}/${route.name}: crops failed: ${String(err.message || err).slice(0, 200)}`);
        }
      }
      await hi.close();
    }
  }
} finally {
  await browser.close();
}

writeJSON(join(root, 'index.json'), index);
const failed = index.items.filter((i) => i.failed).length;
const withErrors = index.items.filter((i) => i.errors && i.errors.length).length;
console.log(`\n${index.items.length} page shot(s) in ${root}${failed ? `, ${failed} failed` : ''}${withErrors ? `, ${withErrors} with console errors or failed requests (see index.json)` : ''}`);
