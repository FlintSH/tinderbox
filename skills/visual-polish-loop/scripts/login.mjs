#!/usr/bin/env node
// Log in once with the config's login steps and save the browser storage
// (cookies + local storage) so every capture and audit runs signed in.
// Use a disposable test account on a local instance, never a real one.
//
// usage: node login.mjs [--config path] [--state name]
// config: "login": { "steps": [ { "goto": "/login" }, { "fill": ["#email", "demo@example.com"] }, ... ] },
//         "storageState": "auth.json"   (relative to the config's folder)
import { launch, loadConfig, newStateContext, parseArgs, pick, fromConfig, runActions } from './lib.mjs';

const args = parseArgs();
const config = loadConfig(args);
if (!config.login || !config.login.steps) { console.error('config.login.steps is missing'); process.exit(2); }
const target = fromConfig(config, config.login.storageState || config.storageState || 'auth.json');
const state = { ...(args.state ? pick(config.states, args.state)[0] : config.states[0]), storageState: null };
const browser = await launch();
try {
  const context = await newStateContext(browser, { ...config, storageState: null }, state, config.viewports[0], { freeze: false });
  const page = await context.newPage();
  await runActions(page, config, config.login.steps);
  await page.waitForTimeout(500);
  await context.storageState({ path: target });
  console.log(`saved signed-in storage to ${target} (now at ${page.url()})`);
  await context.close();
} finally {
  await browser.close();
}
