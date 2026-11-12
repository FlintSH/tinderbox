# Routing

Three layers, from outside in.

1. **Global instructions** (`router/core.md`, installed as a managed block in
   `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`). Always loaded. The tinderbox
   defaults, plus which skill handles which kind of task. Your own rules sit
   below the block; `router/personal/` has an example.
2. **`delivery`** (the router skill, in the `tinderbox` plugin). Loaded for
   substantial work. Owns task setup, worktrees, resource limits, verification,
   delivery and handoffs. Sends UI work to `visual-qa`, PR work to
   `pr-follow-through`, and media to `render-qa`.
3. **Method skills.** How to do the engineering itself. In Claude Code that's
   pstack's playbooks and principles. tstack, Vercel and the others cover their
   own narrow areas.

## Where pstack fits

pstack ships its own router, `poteto-mode`, and it's manual-only
(`disable-model-invocation: true`). Almost every other pstack skill is too. So
installing it doesn't take over routing. Claude only sees `pstack:setup-pstack`
in its skill list, plus the `pstack:poteto-agent` and `pstack:comment-sicko`
agents.

`delivery` reads pstack files by path instead. It resolves the install
per harness (`~/.claude/plugins/cache/cursor-plugins/pstack/<version>/` or
`~/.codex/plugins/cache/tinderbox-pstack/pstack/<version>/`) and reads that
harness's adapter, `docs/harness/claude-code.md` or `docs/harness/codex.md`,
once per session for the Cursor name mapping.

| Task shape | pstack file |
| --- | --- |
| Reported defect | `playbooks/bug-fix.md` |
| Measured slowness, or one metric to push | `playbooks/perf-issue.md`, `playbooks/hillclimb.md` |
| Leak, spin or glitch; captured profile | `playbooks/runtime-forensics.md`, `playbooks/trace-forensics.md` |
| New behavior; structure-only change | `playbooks/feature.md`, `playbooks/refactoring.md` |
| Empirical design fork | `playbooks/prototype.md` |
| Read-only "how/why/are we sure" | `playbooks/investigation.md`, `skills/how`, `skills/why` |
| Change with unclear reach | `skills/blast-radius` |
| Benchmark or speedup claim | `skills/benchmark-checklist` |
| No repeatable app proof in a repo | `skills/create-verification-skill` |
| PR title, body, release notes | `skills/unslop` |

You can still type `/pstack:poteto-mode` to run a whole task pstack's way. The
precedence rules below still apply, because `CLAUDE.md` is always loaded.

## Precedence

Where pstack and tinderbox disagree:

| Area | pstack default | Here |
| --- | --- | --- |
| Opening and landing PRs | `opening-a-pr`, `babysit`, `shipping` | `pr-follow-through` and `file-pr`, with screenshots and review bots checked on the current head |
| Autonomy | External actions proceed without asking | Commit, push, merge, deploy and messages only as the current request allows |
| Fan-out | `arena`, `swarm`, `autopilot-full`, `orchestrate` fleets | Three subagents max unless asked, concurrency sized to the machine. Autopilot and orchestrate only by name. |
| Models | Grok 4.7 for code, Opus 5.5 for judgment | Claude models in Claude Code, OpenAI models in Codex. Cross-provider review goes through `council`. |
| `/deslop`, `control-ui`, `control-cli` | `cursor-team-kit` plugin | `code-simplifier`, `visual-qa` + `playwright-cli`, run the CLI directly |
| Bugbot, Cursor automations, cloud agents | Used | Skipped with a one-line note |

## Overlap kept on purpose

| Need | Used | Not used |
| --- | --- | --- |
| Take over another agent's work | `takeover` (tstack) | pstack `session-pickup` |
| Multi-model review | `council` (tstack) | pstack `interrogate`, which stays within one provider per harness |
| Keep going until done | `full-send`, `sol-loop` | pstack `autonomous-run` |
| UI parity and polish | `visual-qa`, `visual-polish-loop` | pstack `visual-parity` for pixel-exact migrations only |

## Codex

Codex runs the same upstream pstack commit as Claude Code. Upstream only ships
Cursor and Claude Code trees, so `scripts/build-pstack-codex.sh` builds a Codex
plugin from the pinned commit:

- Upstream skills, agents, docs, README and LICENSE, copied as-is.
- `agents/openai.yaml` with `allow_implicit_invocation: false` on the 57 skills
  upstream marks `disable-model-invocation`. They stay manual in Codex too.
- An "In Codex, read the Codex adapter" line on the same 23 skills upstream
  wraps for Claude Code. That line is the only text change.
- `docs/harness/codex.md`, tinderbox's adapter, written in the same shape as upstream's
  Claude Code one. Maps `Task` to `spawn_agent`/`wait_agent`, todolists to
  `update_plan`, transcripts to Codex rollouts, models to `~/.codex/pstack-models.md`.

It installs as `pstack@tinderbox-pstack` from a local marketplace at
`~/.local/share/tinderbox/pstack-codex`. Codex model roles use `gpt-6.1-sol`,
`gpt-6-astra` and `gpt-6.1-terra` (`router/codex/pstack-models.md`).

I skipped the michael-denyer/pstack-claude port. It does ship a native Codex
plugin, but it forks 62 files with its own policy changes and adds a
SessionStart hook that pushes every task into `poteto-mode`. That would compete
with `delivery`, and Claude Code and Codex would run different pstacks.
