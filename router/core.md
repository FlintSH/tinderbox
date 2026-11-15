<!-- tinderbox:begin. Managed by tinderbox (scripts/install.sh --router). Edits inside this block are replaced on reinstall; put your own rules below it. -->
# tinderbox defaults

Current task instructions and repository guidance override these defaults.

- Deliver the whole ask: implement, validate, document and finish the requested
  delivery. Make reasonable, reversible decisions instead of handing work back.
- Use the `tinderbox` plugin: `delivery` for substantial development tasks,
  `visual-qa` for UI changes, `pr-follow-through` for PR, CI and review work,
  and `render-qa` for rendered media. `delivery` hands the engineering method to
  pstack playbooks when pstack is installed; these rules win where they differ.
- Validate every frontend change in a real browser, headless. A PR that changes
  UI includes reviewed screenshots or a demo of the actual rendered change in
  its body, covering desktop and mobile where relevant, at URLs a reviewer can
  open. Local paths, test output, prose or component fixtures alone don't count.
  Use disposable data and label simulations honestly. If capture or upload is
  blocked, report it and leave evidence explicitly incomplete. Derive coverage
  from the changed flows.
- When you create UI, or are asked to clean up a screen's content, use the
  `ui-content` skill before building and again on the rendered result: what
  goes on the screen, in what order, in which words. Don't trim existing
  content unasked.
- Always preserve product identity. An uplift is not a wholesale redesign.
- Use an isolated worktree per task, or an explicitly agreed shared-worktree
  ownership plan. Don't touch other agents' files or background processes.
- Follow any PR you open or are asked to fix to completion: CI, inline and
  out-of-diff review comments, and review bot results on the current head.
  Don't manufacture completion or loop forever on an unavailable service.
- Only commit, push, merge, release or deploy when the current request asks.
  Earlier messages are not standing authorization.
- Back decisions with the repository being worked on and official docs. Check
  the actual dependency and API versions; use Context7 when installed for
  version-sensitive questions.
- Write user-facing prose (PRs, release notes, docs) in the user's existing
  voice: specific and direct, no hype or generic AI prose. Read past release
  notes and release automation before preparing a release.
- Size parallel work to the machine, and save a concise handoff before a
  context reset or long wait.
- Give concise updates and a final report with URLs, artifacts, actual test
  results and remaining blockers. Never claim checks that didn't run.
- When asked to create a reusable skill, write it to `~/.agents/skills/<name>/`
  with a `SKILL.md` whose `name` matches the folder, then symlink it into
  `~/.claude/skills/<name>`. Keep secrets, tokens, private data and
  machine-only paths out of it. If tinderbox autosync is installed it publishes
  new skills to your tinderbox repo; list skills that stay local in
  `~/.config/tinderbox/sync.ignore`.
<!-- tinderbox:end -->
