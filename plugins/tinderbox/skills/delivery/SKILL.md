---
name: delivery
description: Carry a software task end to end, from an isolated worktree through implementation, verification and delivery to a resumable handoff. Use for substantial feature, bug-fix or refactor work, especially when the user hands off a task and expects a finished, verified result without supervising it.
---

# Delivery

The user gives the goal and the constraints, then expects a finished,
verified result without babysitting. Current instructions and repository rules
take precedence over everything below. The user's global instructions may add
personal specifics (machine limits, products, review bots, voice); follow them.

## Establish the task

1. Read the repository's AGENTS.md/CLAUDE.md, relevant architecture, package
   manifests and lockfile, and current Git status. Inspect the task's actual
   branch, base, issue, and any existing worktree before editing.
2. Identify observable acceptance criteria: behavior, configuration,
   compatibility, UI polish, test evidence, and the requested delivery method.
   Make reasonable reversible choices; ask only about consequential ambiguity.
3. Substantial unrelated tasks need isolated Git worktrees. Reuse a worktree the
   harness already made for this task. Do not switch or reset a shared checkout.
   If several agents intentionally share a worktree, agree on file ownership and
   one Git writer. Earlier requests to push to main do not authorize new pushes.

## Implement and verify

- Preserve the product's identity. Polish existing surfaces rather than
  redesigning them unless the task calls for a redesign.
- Check installed framework and API versions before using new APIs. Consult
  current official docs, or Context7 when installed, for unfamiliar or
  version-sensitive behavior.
- For platform targets (game servers, mobile OS versions, browser engines,
  runtimes), check compatibility against the build's actual target and the
  official API. Never test against production as a substitute for a dev instance.
- Prefer the repository's test and build commands. Add meaningful regression
  coverage for behavior changes, then test affected integrations. For UI work,
  use `visual-qa` without being reminded.
- When you create UI, or are asked to clean up a screen's content, use the
  `ui-content` skill if it is installed: a content plan before building, then
  a read of every string on the rendered screen. It ships outside this plugin.
- Parallelize independent research and edits when useful, with clear ownership.
  Size concurrency to the machine: check CPU and memory before running more than
  one heavy build or render, or more than two browser sessions. Do not
  accumulate background servers or launch redundant agent swarms.

## Engineering playbooks (pstack)

This skill stays the router. When Lauren Tan's pstack plugin is installed, use
its playbooks for the engineering method inside a task. Most pstack skills are
manual-only, so read `<pstack>/skills/<name>/SKILL.md` by path instead of
waiting for them to load. Before following any pstack file, read the adapter
for your harness once per session; it maps Cursor tool, model and path names.

Resolve `<pstack>` for your harness:

- Claude Code: `ls -d ~/.claude/plugins/cache/cursor-plugins/pstack/*/ | sort -V | tail -1`.
  Adapter `<pstack>/docs/harness/claude-code.md`. Model sheet
  `~/.claude/rules/pstack-models.md`, loaded automatically.
- Codex: `ls -d ~/.codex/plugins/cache/tinderbox-pstack/pstack/*/ | sort -V | tail -1`.
  Adapter `<pstack>/docs/harness/codex.md`. Model sheet
  `~/.codex/pstack-models.md`; read it before spawning a role model.

If neither path exists, pstack is not installed: work without it.

| Task shape | Read and follow |
| --- | --- |
| Reported defect | `skills/poteto-mode/playbooks/bug-fix.md` |
| Measured slowness, or one metric to push | `perf-issue.md`, `hillclimb.md` |
| Leak, spin or glitch; captured profile | `runtime-forensics.md`, `trace-forensics.md` |
| New behavior; structure-only change | `feature.md`, `refactoring.md` |
| Empirical design fork | `prototype.md` instead of asking the user |
| Read-only "how/why/are we sure" | `investigation.md`, `skills/how`, `skills/why` |
| Change with unclear reach | `skills/blast-radius` before editing |
| Benchmark or speedup claim | `skills/benchmark-checklist` before reporting it |
| A project with no repeatable app proof | `skills/create-verification-skill` (ask once) |
| PR title, body, release notes | `skills/unslop` after drafting |

Playbook paths are under `<pstack>/skills/poteto-mode/playbooks/`. Read each
`principle-*` leaf a playbook cites before applying it.

These rules win wherever pstack differs:

- **Delivery.** PR creation, CI and reviews stay with `pr-follow-through` and
  `file-pr`. pstack's `opening-a-pr`, `babysit` and `shipping` playbooks are
  reference material only. Its autonomy section does not authorize commits,
  pushes, merges, external messages or deploys beyond the current request.
- **Resources.** `arena`, `swarm`, `interrogate` and `architect` fan-out is
  capped at three subagents unless the user asks for more. Code-writing lanes
  get their own worktree (`isolation: "worktree"` in Claude Code,
  `git worktree add` in Codex). Skip `autopilot-full` and `orchestrate` unless
  the user asks for them by name.
- **Models.** The model sheets map pstack's roles to models the harness can
  reach. Cross-provider review stays with `council`.
- **Missing Cursor parts.** `cursor-team-kit` is not installed. For `/deslop`
  use `pr-review-toolkit:code-simplifier` when available; for `control-ui` use
  `visual-qa` and `playwright-cli`; for `control-cli` run the CLI directly. Skip
  Bugbot, Cursor automations and cloud-agent steps with one line, as the
  adapter says.
- **Voice.** pstack's reply rules (short sentences, no long dashes, evidence
  labels) can be used as written. Keep its first-message goal restatement to
  two sentences.

## Finish

- Use `pr-follow-through` when the request includes a PR or review fixes.
- Commit, push, create releases, or merge only when the current task authorizes
  that action. Inspect the repository's release automation first; do not assume
  how releases are cut.
- Report actual outcomes: URLs, tested scenarios, evidence links, failures,
  and anything that genuinely needs the user's action. Do not say a preview,
  platform build, release, or review passed without checking it.
- Before a context reset or long wait, leave a concise handoff outside tracked
  source, e.g. the task's `.agent-artifacts/HANDOFF.md`. Include branch/worktree,
  objective, completed changes, commands/results, PR/head SHA, blockers, owned
  files, resource/session names, and the exact next action. Never include tokens.
- Stop only servers and browser sessions you own. Keep useful evidence and avoid
  deleting unrelated worktrees, caches, or user work.
