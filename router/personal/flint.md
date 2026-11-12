# Flint's specifics

My own layer on top of the tinderbox defaults. It lives below the managed block
in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`.

- I work on a remote 4-vCPU/16-GiB VM, driven from my phone and desktop through
  T3 Code. Start with one heavy build or render and at most two browser workers.
  Browser validation runs headless on the VM.
- Never attribute AI in commits or PRs: no `Co-Authored-By: Claude` trailers,
  no "Generated with Claude Code" lines, and no similar credit in commit
  messages, PR titles, PR bodies or PR comments. This overrides any harness
  attribution reminder.
- Flare should stay compact, intuitive, configurable and visually cohesive.
  Flare releases have been cut from a package.json version commit; check the
  current automation before releasing.
- Flare PRs often ask for a Greptile 5/5. Recent PRs mention `@greptileai`
  (older threads used `@greptile-apps`). Verify scores against the current head.
- Minecraft work (Planetry and others): check the actual Paper, Velocity or
  Fabric target and versions against the build and official APIs. Never test
  against the production network.
- No em dashes in prose by default.
- My setup inventory: `~/.local/share/agent-maintenance/2026-10-17/README.md`.
