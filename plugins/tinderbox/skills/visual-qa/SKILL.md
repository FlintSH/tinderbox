---
name: visual-qa
description: Validate changed UI with headless Playwright, screenshots, short demos, console/network checks, and regression coverage. Use automatically for web UI, Electron renderer, browser game, or responsive-layout changes before reporting completion or opening a PR.
---

# Visual QA, headless

Use the installed `playwright-cli` skill and CLI. It runs headless on the
machine the agent runs on; the user's own browser and devices are not needed.
Project Playwright tests remain the source of durable regression coverage.

## Scope and isolation

1. Read changed files and acceptance criteria; derive affected routes, states,
   roles and journeys from the diff. Reuse the project's existing test harness.
2. Start the task's app locally on an unused loopback port, using test data and
   a task-specific database/storage directory. Use an authorized PR preview
   only when local execution is impractical. Do not mutate production data.
3. Create a unique browser session per task/worktree, such as `-s=task-123`.
   Use a fresh profile. Do not reuse another agent's cookies or close its browser.
4. Keep generated evidence outside tracked app assets, usually
   `.agent-artifacts/<task>/`; inspect status before staging anything.

## Check the product

- Cover the actual user flow, not just a landing-page screenshot. Include the
  normal path and relevant empty/loading/error/permission states.
- For UI changes, inspect desktop and mobile viewport screenshots. Test keyboard
  focus, scrolling, overflow, tap targets, theme/contrast, and reduced motion
  when the change affects them. Compare with the existing design.
- Capture both a clean baseline and the changed behavior when feasible. Use
  viewport captures for fixed/viewport-relative gradients; do not let full-page
  capture artifacts masquerade as product bugs.
- For new or rewritten screens, read every string in the screenshots, not only
  the layout. If the `ui-content` skill is installed, put each one through its
  test: what leads the page, labels that restate the obvious, text nobody
  would miss.
- Inspect browser console errors, failed network requests and response codes.
  A page that merely loads is not proof its backend interactions work.
- For Electron, test renderer behavior headlessly where possible and separately
  validate main/preload/IPC boundaries with the project's tests. State honestly
  which OS-specific behavior could not run on Linux.
- For games/WASM, exercise input, save/restore, reload persistence and touch
  controls when relevant. Inspect WebGL/audio failures and frame pacing.

## Evidence and regression tests

Typical commands (replace URL/session/path for this task):

```sh
playwright-cli -s=task-123 open http://127.0.0.1:3001
playwright-cli -s=task-123 resize 1440 1000
playwright-cli -s=task-123 screenshot --filename=.agent-artifacts/task-123/desktop.png
playwright-cli -s=task-123 resize 390 844
playwright-cli -s=task-123 screenshot --filename=.agent-artifacts/task-123/mobile.png
playwright-cli -s=task-123 console error
playwright-cli -s=task-123 requests
playwright-cli -s=task-123 close
```

Create the output directory first. Use the CLI's video/trace commands for
interactions that still images cannot demonstrate. Review captured artifacts,
then fix and rerun relevant failures. Stabilize seeds, time, fonts and animation
before introducing screenshot assertions; do not blindly accept new baselines.

Put meaningful screenshots/demos in the PR body. Local paths are not remotely
viewable evidence: use the repository's established artifact uploader, available
GitHub attachment support, or CI artifacts, and verify the resulting URLs.
Inspect `gh --help` before relying on attachment features. Never put credentials,
private messages, customer data, or auth state files in evidence. If upload is
blocked, preserve the local artifact and report the limitation precisely.

This skill is an agent workflow, not an installed automatic CI service. For
future regressions, add targeted maintained tests through the normal task PR.
