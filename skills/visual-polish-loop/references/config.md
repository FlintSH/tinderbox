# config.json reference

One file drives every script. Keep it at
`<project>/.agent-artifacts/visual-polish/config.json` (untracked). Paths inside
it are relative to its folder. Start from `assets/config.example.json`.

| Field | Meaning |
| --- | --- |
| `baseUrl` | The local app, e.g. `http://127.0.0.1:3101`. Never production. Override with `--base`. |
| `out` | Where shots/, sheets/ and metrics/ go. Default `.` (the config's folder). |
| `src` | Source folders for `palette-audit.mjs static` (default: the project root). |
| `routes` | `[{ name, path, actions?, query?, crops?, mask?, fullPage?, wait? }]`. One entry per page or page state worth seeing. An open menu, a dialog, an error state or an empty list is its own route with `actions`. |
| `states` | `[{ name, colorScheme?, reducedMotion?, localStorage?, cookies?, query?, firstVisit?, css?, init?, actions?, hide?, storageState? }]`. Themes, modes and app states applied to every route: dark/light, a seasonal theme, lights off, a custom accent preset, a signed-out view. |
| `viewports` | `[{ name, width, height, mobile? }]`. Captures use all; audits default to the first (`--viewports all` for every one). |
| `storageState` | Saved login (from `login.mjs`). Per-state override possible; `null` for signed-out states. |
| `login` | `{ steps: [actions], storageState? }` for `login.mjs`. Use a disposable local account. |
| `hide` | Selectors hidden in every capture (dev overlays like `nextjs-portal`, cookie banners, live chat widgets). |
| `mask` | Selectors painted grey in captures (timestamps, avatars, live counters) so diffs show design changes, not data. |
| `expand` | Extra selectors to grow to full height before full-page shots (inner scroll panels are detected automatically). |
| `crops` | `[{ name, selector, pad?, nth?, max? }]`: named 2x detail crops on every route that has the element. |
| `autoCrops` | `{ selectors: [...], maxPerSelector, minSize }`: 2x crops of the first few visible matches of common components (buttons, inputs, tabs, dialogs, tables, cards). |
| `audit.hide` | Hidden only while measuring contrast/palette (decorative overlay canvases, particles) so they don't count as text background. |
| `audit.ignore` | Elements to skip when measuring (e.g. code blocks with their own syntax theme if out of scope). |
| `waitMs` | Settle time after load and actions (default 800). |
| `freezeAnimations` | Default true: kills transitions and caret blink for repeatable shots. |
| `maxPageHeight` | Full-page shots and audits stop at this height (default 16000). |

## Actions

Used by `routes[].actions`, `states[].actions` and `login.steps`, run in order:

```json
{ "goto": "/path" }            { "click": "text=Upload" }       { "hover": "nav >> text=Docs" }
{ "fill": ["#email", "x@y"] }  { "select": ["#plan", "pro"] }   { "check": "#agree" }
{ "press": "Escape" }          { "wait": 400 }                  { "waitFor": "[role=dialog]" }
{ "eval": "window.scrollTo(0, 600)" }                            { "scroll": 600 }
```

Selectors are Playwright selectors (CSS, `text=`, `role=`, `>>` chains).

## States for common setups

- **next-themes / class dark mode:** `{ "name": "dark", "colorScheme": "dark", "localStorage": { "theme": "dark" } }`.
  Check the app's storage key; some use their own.
- **A theme behind a query flag or cookie:** `"query": "theme=winter"` (appended
  to every route) or `"firstVisit": "/?theme=winter"` if the app sets a cookie.
- **Admin-customisable colours:** a state whose `css` overrides the token
  variables with a preset (write one file per preset/extreme), or `actions`
  that apply the preset through the app's own settings on a disposable instance.
- **App state flags:** `"init": "window.__FEATURE_X__ = true"` runs before page scripts.
