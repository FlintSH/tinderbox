---
name: visual-polish-loop
description: Run a recursive, evidence-driven visual polish loop on a web UI. Audit every page, theme and state against a quality bar (palette, contrast, surfaces, typography, spacing, component states, focus), prototype genuinely different directions on the real pages, implement the winner through design tokens, then capture, have independent reviewers scrutinize, fix and repeat until a round comes back clean, and deliver a PR with before/after evidence and metrics. Use this whenever someone asks to polish, refine, clean up, unify, uplift or "make seamless" a UI, theme, palette or colour system, close a quality gap between two themes or screens, do a design or finish pass with high scrutiny, or says "visual clean loop" / "visual polish loop", even if they only mention colours or say it "doesn't feel as polished as" something. Not for building new features or single-bug visual fixes.
---

# Visual polish loop

Raise a UI's finish to a clear bar by measuring, prototyping and reviewing on
the real rendered pages, in rounds, until fresh reviewers stop finding problems.

This is modelled on a run that worked very well (fl1nt.dev's Christmas palette,
`references/worked-example.md`). The agent named concrete root causes: warm
brown panels on a navy sky, khaki tints, sepia text, 8 golds and 11 reds. It
tried four real directions on the live pages and rebuilt the palette as tokens
from the art's own colour ramps. It measured contrast across 777 text elements
before and after, and a review pass caught three leftovers before the PR. That
depth is the standard here.

## What you deliver

- A PR (unless told otherwise; never merge without authorization) containing
  the audit findings, the system chosen and why, the directions tried,
  before/after evidence for every page and state in scope, metrics before and
  after, what was checked, and pre-existing issues you noticed.
- Working files under `.agent-artifacts/visual-polish/` (untracked):
  `brief.md`, `config.json`, `audit.md`, `directions/`, `loop-log.md`,
  `shots/`, `sheets/`, `metrics/`, and a handoff note for context resets.

## Principles, and why

1. **The bar decides.** "Polished" means nothing until you name what it's
   measured against: the product's best screens, its other theme, its brand
   art, a design system. For the Christmas theme the bar was the everyday
   theme's restraint ("few hues, high contrast, crisp"). Describe the bar in
   its own terms before touching anything.
2. **Measure on the real pages.** Users see rendered pixels, not source. Work
   from screenshots of the running app, computed colours and contrast numbers.
   Reading CSS or mocking up screens misses tint stacking, overrides and
   states.
3. **Everything, not a sample.** Cover every route, theme, state and viewport
   in scope. Sample-based checks have missed most failures before. The bugs
   live in the dialog nobody opened and the empty state nobody seeded.
4. **Uplift, not redesign.** Keep the product's identity, layout and features.
   Fix cohesion and finish. Change layout only when a finish problem demands
   it, and say so. The user's global instructions may describe a product's
   identity; follow them.
5. **Systems over patches.** One source of truth (tokens/CSS variables), each
   colour with one job, states derived from tokens. A hex tweak that fixes one
   screen quietly breaks another.
6. **Fresh eyes.** The author is the worst reviewer of their own pass.
   Reviewers get the bar and the evidence, never your conclusions.
7. **Bounded.** Rounds have exit criteria. Converge, report what remains, stop.

## The scripts

All in `scripts/` (Node ESM, need only Playwright: the project's own, a global
install, or the playwright-cli bundle; set `PLAYWRIGHT_PATH` otherwise).
Run them from the project root. They read
`.agent-artifacts/visual-polish/config.json` (pass `--config` to override).
Start the config from `assets/config.example.json`; every field is documented
in `references/config.md`.

| Script | What it gives you |
| --- | --- |
| `capture.mjs --tag T [--css proto.css]` | Full-page shots of every route × state × viewport, 2x crops of named and common components, console errors and failed requests per page. `--css` injects a prototype stylesheet. |
| `sheet.mjs grid\|pairs\|compare\|crops` | Review sheets: overview grids, before/after tiles at 1:1, directions side by side, crop boards. |
| `contrast-audit.mjs --tag T` | Contrast for every visible text and placeholder, measured against the actual pixels behind it (gradients, images, translucency included). WCAG 2 and APCA, worst offenders, `--compare a.json b.json`. |
| `palette-audit.mjs static` | What the source declares: colour literals, custom properties, Tailwind classes. Near-duplicates, families, literals outside tokens. |
| `palette-audit.mjs runtime --tag T` | What the screen shows, by role (surfaces, text, borders, icons, gradients, shadows), weighted by area. Also renders a palette card PNG. |
| `focus-sheet.mjs --tag T` | Tabs through each page and crops every focus stop at 2x. Flags stops with no visible focus or a weak one (under 3:1 change contrast). |
| `login.mjs` | Saves a signed-in session from `config.login` steps, for apps behind auth. |

Shorthand below: `S=<this skill's dir>/scripts`.

## Phase 0: Frame the job → `brief.md`

- Read the repo's AGENTS.md/CLAUDE.md, contributing docs, theme/token files,
  component library and package manifest. Note repo rules for visible changes.
  Some repos require refreshed documentation screenshots or run their own
  visual tests. Follow those as well as this skill.
- Write `brief.md`:
  - the user's words verbatim
  - the bar, described concretely
  - scope: routes, themes/modes, states, viewports
  - out of scope
  - constraints
  - other agents' files to avoid
  - isolation: worktree, branch, port
  - delivery
- If users or admins can customise colours (accent pickers, theme presets,
  custom tokens), put the defaults plus a few presets and extremes in scope.
  Derived colours (text on accent, focus rings) must hold across that range.
- Ask the user only when the bar or scope is ambiguous and the choice is
  consequential. Otherwise write your assumption down, and repeat it in the PR.

## Phase 1: Harness and baseline

- Run the app locally with disposable data (see `visual-qa` if installed).
  Never point captures at production. Seed realistic content: full, empty,
  long text, errors, permissions, many items.
- Write `config.json`:
  - every route
  - interactive states as their own routes with `actions` (open menus,
    dialogs, toasts, form errors, hover menus)
  - states (themes, modes, presets, special modes)
  - viewports
  - `crops`/`autoCrops` for component detail
  - `mask` for live data and `hide` for dev overlays
- If the app needs a login, run `node $S/login.mjs`.
- Baseline:
  ```sh
  node $S/capture.mjs --tag before
  node $S/contrast-audit.mjs --tag before --viewports all
  node $S/palette-audit.mjs static --tag before
  node $S/palette-audit.mjs runtime --tag before
  node $S/focus-sheet.mjs --tag before
  node $S/sheet.mjs grid --tag before && node $S/sheet.mjs crops --tag before
  ```
- Read `shots/before/index.json` for console errors and failed requests. Note
  the pre-existing ones, so you don't later mistake them for your regressions.
- If the bar is another theme or screen, capture it too (as its own tag or
  state) so you can put it side by side with the target.

## Phase 2: Audit → `audit.md`

- Look at every sheet yourself, at full size. Go through
  `references/audit-checklist.md`.
- Write numbered findings. Each one names the place, the problem, why it
  breaks the bar, the evidence (sheet path, crop, numbers, selector) and the
  root cause (a token, a component, a stray literal).
  - Bad: "the colours feel off".
  - Good: "Panels are `rgba(20,13,7,.9)` brown on a navy sky, so every panel
    edge is a warm/cold seam (home, about, blog)".
- Summarize the palette as measured: families, near-duplicates, roles, which
  literals bypass the tokens. Then the contrast stats, the focus failures and
  the states that look unfinished.
- For large UIs, an independent auditor (finish-reviewer brief) at this stage
  catches what your eye has already normalized.

## Phase 3: Directions → `directions/`

- Draft 2–4 genuinely different directions that answer the root causes.
  `references/directions.md` explains how to vary them. Write each as a
  token-override stylesheet in `directions/<name>.css`. Don't edit source yet.
- Capture each with `--css` on the hardest pages and states. Contrast-audit
  each. Build `sheet.mjs compare --tags before,dir-a,dir-b,...`.
- Pick one against the bar and the product's identity. Write one line on why
  each loser lost; it goes in the PR. If two are close, get a blind judgement
  (direction-judge brief).

## Phase 4: Implement

- Tokens first: semantic surface levels, text levels, accent roles, borders,
  focus, state colours. Map existing usages onto them. Remove the literals the
  palette audit flagged. Derive hover/active/disabled/focus from tokens. Cover
  every mode and preset in scope.
- Keep the diff to colour and finish unless a finding requires more. Build and
  run the repo's tests as you go.

## Phase 5: The loop → `loop-log.md`

Each round:

1. **Capture** everything in scope as `--tag rN`. Build `pairs --a before --b rN`
   and crop boards.
2. **Measure:**
   - `contrast-audit --tag rN`, then `--compare` against before
   - `palette-audit` (static + runtime)
   - `focus-sheet`

   Nothing may regress. No new text below AA unless decorative or disabled,
   no lost focus rings, no new console errors.
3. **Review:** split the sheets into disjoint sets. Give 3 reviewers the
   finish brief (fewer for small UIs) and 1 the regression brief, from
   `references/reviewer-brief.md`. Zoom in as rounds progress:
   - round 1: whole pages (system level: palette, surfaces, hierarchy)
   - round 2: component crops (buttons, inputs, menus, tables, dialogs)
   - round 3 onward: 2x detail (1px borders, ring offsets, icon alignment,
     placeholder text, disabled and empty states)
4. **Triage** in `loop-log.md`. Severity is high, medium or low. Verify each
   finding against the evidence before acting (reviewers misread crops), and
   record rejected ones with the reason. Fix root causes, not symptoms.
5. **Fix** highs and mediums, plus cheap lows, then re-capture what changed.

**Exit** when a full round (all sheets, fresh reviewers) reports no high or
medium findings and the metrics hold. Also stop after 4 rounds (the default;
the user can set another number) and report what remains honestly. Don't loop
on taste: if reviewers disagree on a low, the bar decides, and if the bar is
silent, leave it.

## Phase 6: Deliver

- Write the PR body from `references/pr-template.md`, in the owner's voice and
  following their attribution rules. Include:
  - the palette card (`metrics/palette-<tag>.png`)
  - the directions sheet
  - before/after for every page and state
  - the metrics table and the review rounds
- Host images the way the repo already does (assets branch, attachments), and
  check every URL loads.
- Follow the repo's process for visible changes (docs screenshots, visual
  tests). Use `pr-follow-through` for CI and review-bot feedback. Don't merge
  unless authorized.
- Leave a short handoff in `.agent-artifacts/visual-polish/HANDOFF.md`:
  branch, PR, head, what's left, how to resume.

## Working alongside other agents

- Size work to the machine: by default one heavy build at a time and at most
  two browser workers. Run capture states one after another rather than in
  parallel. Reviewer
  subagents cost model calls, not CPU, so run them in parallel.
- Use your own worktree, branch and port. Never touch other agents' servers,
  harnesses or files.
- Subagents:
  - Claude Code: the Agent tool, or the host's delegation tool when it has one
  - Codex: `spawn_agent`
  - Without subagents: follow the single-agent review note in
    `reviewer-brief.md`, and say so in the PR
- Commits and PR text follow the user's global rules, including any rules on
  attribution and voice.
