# pstack in Codex

pstack skills use Cursor names. In Codex, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` is the folder that holds `skills/`, `agents/` and `docs/`; resolve it with `ls -d ~/.codex/plugins/cache/tinderbox-pstack/pstack/*/ | sort -V | tail -1`. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

This adapter is maintained in FlintSH/tinderbox, not upstream. It follows the shape of upstream's `docs/harness/claude-code.md`. The Codex transcript layout and subagent notes draw on Michael Denyer's MIT-licensed pstack-claude port.

## Tools

| Cursor | Codex |
| --- | --- |
| `Task` | `spawn_agent`, then `wait_agent` for its result. Several `spawn_agent` calls in one response run in parallel. Use `close_agent` on a finished agent when the session offers it. |
| `AskQuestion` | Ask in plain text. Codex has no structured-choice tool outside plan mode. |
| Open a todolist | `update_plan`. |
| Run another pstack skill (`/name` or "the **name** skill") | Read `<pstack>/skills/<name>/SKILL.md` and follow it. Most pstack skills are manual-only, so they are not in your implicit skill list. When you tell the user to type one, write `$pstack:<name>`. |
| `Grep`, `Glob`, `Read` | Shell: `rg`, `find`, `sed -n`, `cat`. |
| Edit a file | `apply_patch`. |

A thread-limit error from `spawn_agent` is a capacity error, not a rejected model. Stop spawning, finish or close an agent, then continue. Do not retry with another model.

## Subagent fields

| Cursor | Codex |
| --- | --- |
| `subagent_type: generalPurpose` | `spawn_agent` with no agent role. |
| `poteto-agent` | `spawn_agent` whose message starts: "Read `<pstack>/agents/poteto-agent.md` and `<pstack>/skills/poteto-mode/SKILL.md` in full before any work." Pass absolute paths. |
| `comment-sicko` | `spawn_agent` whose message starts: "Read `<pstack>/agents/comment-sicko.md` in full before any work. Do not edit files." |
| `readonly: true` | Say "do not edit files" in the message, then check `git status` afterward. |
| `environment: "cloud"` | Create a worktree yourself (`git worktree add`), name its path and branch in the message, and have the worker stay inside it. |
| `environment: "local"`, `run_in_background` | Omit. `spawn_agent` already runs alongside your turn. |
| `cloud_base_branch: <b>` | Base the worktree on `<b>`. |
| `resume` | Spawn a new agent and paste the earlier result into its message. |
| `file_attachments` | List the paths in the message. |

## Models

pstack's role defaults name Claude and Grok slugs. Neither resolves in Codex.

| Cursor | Codex |
| --- | --- |
| The `pstack-models.mdc` rule | `~/.codex/pstack-models.md`. Codex does not load it on its own. Read it before the first spawn that needs a role model. |
| A role value `<model> <effort>`, such as `gpt-6.1-sol xhigh` | `spawn_agent` with `model: "gpt-6.1-sol"` and `reasoning_effort: "xhigh"`. |
| `auto` or `inherit-parent`, or a `claude-*` / `grok-*` slug with no role line | Omit `model` and `reasoning_effort`, so the agent runs like the parent, and say so. |
| A panel list such as `arena runners` | One `spawn_agent` per entry. If the sheet lists one model family only, vary effort and note that diversity was reduced. |

If `spawn_agent` rejects a model or effort, omit that field and say so. Do not guess another slug.

## setup-pstack

Follow its steps with these changes:

- Detect. The detected models are the ones Codex lists in `/model` or `~/.codex/models_cache.json` with visibility `list`. Write a real model as `<slug> <effort>`.
- Defaults. `claude-opus-5-5-xhigh` becomes the strongest listed model at `xhigh`. `grok-4.7-xhigh-fast` becomes `inherit-parent`.
- Write. Write `~/.codex/pstack-models.md` with no frontmatter: the comment lines, the `# budget` line, and one line per role. Overwrite the whole file. Never put role lines in `AGENTS.md`.

## Paths

| Cursor | Codex |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.agents/skills/`, `~/.agents/skills/` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.codex/plugins/cache/`, `.codex-plugin/plugin.json` |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` (project root), or `~/.codex/AGENTS.md` for global rules. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | Rollouts in `${CODEX_HOME:-~/.codex}/sessions/YYYY/MM/DD/rollout-*.jsonl` and `archived_sessions/`. Older ones are `.jsonl.zst`; read them with `zstd -dc`. The first line is a `session_meta` record; keep only rollouts whose `payload.cwd` is this workspace or one of its worktrees. Messages are `response_item` records with `payload.type` `message`; skip `developer` records. The current session's rollout ends in `-$CODEX_THREAD_ID.jsonl`. Never read other projects' sessions or `~/.claude/projects/`. |
| A generated project skill under `.cursor/skills/` | `.agents/skills/<name>/` in the project. |

## Cursor-only features

Codex has no Cursor Automations, Bugbot, Cursor cloud agents, `/loop`, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in Codex: <step>. <reason>.`, then go on. Do not stop, ask, or retry. When a later step needs what the skipped step made, leave a placeholder and name it in the line.

| Cursor | Codex |
| --- | --- |
| Cursor Automations and their webhooks | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads; triage them with `gh`. Skip steps that start or configure Bugbot. |
| `/loop` | Re-run the step yourself at the cadence the skill names, inside this turn's budget. |
| A built-in PR tool | `gh pr create` and friends. Not a skip. |
| `cursor-team-kit` `/deslop`, `control-ui`, `control-cli` | Not installed. Use the mapping in tinderbox's `delivery` skill. |
