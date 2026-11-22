# pstack in Antigravity

pstack skills use Cursor names. In the Antigravity CLI (`agy`) or an Antigravity session in another app, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` is the folder that holds `skills/`, `agents/` and `docs/`. Resolve it with the first command that prints a path:

```sh
ls -d ~/.codex/plugins/cache/tinderbox-pstack/pstack/*/ 2>/dev/null | sort -V | tail -1
ls -d ~/.claude/plugins/cache/cursor-plugins/pstack/*/ 2>/dev/null | sort -V | tail -1
```

pstack is not installed as Antigravity skills. Antigravity has no manual-only skill flag, so its 58 skills would all compete for automatic use. Read them by path instead.

If a Cursor field has no row, drop it and say so. This adapter is maintained in FlintSH/tinderbox, not upstream. It follows the shape of upstream's `docs/harness/claude-code.md` and tinderbox's Codex adapter.

## Tools

| Cursor | Antigravity |
| --- | --- |
| `Task` | `invoke_subagent` with a role and an initial prompt. Several calls run concurrently. Subagents do not inherit your context, so put everything they need in the prompt. |
| `AskQuestion` | Ask in plain text, or use the ask-question tool when the session offers one. |
| Open a todolist | Use the session's task list or plan artifact when it has one; otherwise keep a short checklist in your reply. |
| Run another pstack skill (`/name` or "the **name** skill") | Read `<pstack>/skills/<name>/SKILL.md` and follow it. When you tell the user to type one, tell them to ask for it by name. |
| `Grep`, `Glob`, `Read`, edit | Your built-in file tools, or the shell (`rg`, `find`, `sed -n`). |

## Subagent fields

| Cursor | Antigravity |
| --- | --- |
| `subagent_type: generalPurpose` | `invoke_subagent` with no custom role. |
| `poteto-agent` | `invoke_subagent` whose prompt starts: "Read `<pstack>/agents/poteto-agent.md` and `<pstack>/skills/poteto-mode/SKILL.md` in full before any work." Pass absolute paths. |
| `comment-sicko` | `invoke_subagent` whose prompt starts: "Read `<pstack>/agents/comment-sicko.md` in full before any work. Do not edit files." |
| `readonly: true` | Say "do not edit files" in the prompt, then check `git status` afterward. |
| `environment: "cloud"` | Use the subagent's isolated worktree option (`branch`) when it is offered. Otherwise create a worktree yourself (`git worktree add`), name its path and branch in the prompt, and have the worker stay inside it. |
| `environment: "local"`, `run_in_background` | Omit. Subagents already run alongside your turn. |
| `cloud_base_branch: <b>` | Base the worktree on `<b>`. |
| `resume` | Message the idle subagent if it is still alive; otherwise start a new one and paste the earlier result into its prompt. |
| `file_attachments` | List the paths in the prompt. |

## Models

pstack's role defaults name Claude and Grok slugs. Antigravity subagents take a model tier, not a slug.

| Cursor | Antigravity |
| --- | --- |
| The `pstack-models.mdc` rule | `~/.gemini/config/pstack-models.md`. Antigravity does not load it on its own. Read it before the first spawn that needs a role model. |
| A role value `pro` or `flash` | Spawn on that tier when `invoke_subagent` accepts a model; otherwise omit it and say the role ran on the parent model. |
| `auto` or `inherit-parent`, or a `claude-*` / `grok-*` slug with no role line | Omit the model, so the subagent inherits the parent, and say so. |
| A panel list such as `arena runners` | One subagent per entry. If every entry resolves to the same model, vary the brief and note that diversity was reduced. |

If a spawn rejects a model, omit it and say so. Do not guess another name.

## setup-pstack

Follow its steps with these changes:

- Detect. The detected models are the ones `agy models` lists for this account.
- Defaults. `claude-opus-5-5-xhigh` becomes `pro`. `grok-4.7-xhigh-fast` becomes `inherit-parent`.
- Write. Write `~/.gemini/config/pstack-models.md` with no frontmatter: the comment lines, the `# budget` line, and one line per role. Overwrite the whole file. Never put role lines in `AGENTS.md`.

## Paths

| Cursor | Antigravity |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.agents/skills/`, `~/.gemini/config/skills/` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.gemini/config/plugins/`, `plugin.json` at the plugin root |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` (project root) or `.agents/rules/*.md`; `~/.gemini/config/AGENTS.md` for global rules. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | Not documented for Antigravity. Skip transcript-mining steps with the line below. Never read other harnesses' transcripts (`~/.claude/projects/`, `~/.codex/sessions/`). |
| A generated project skill under `.cursor/skills/` | `.agents/skills/<name>/` in the project. |

## Cursor-only features

Antigravity has no Cursor Automations, Bugbot, Cursor cloud agents, `/loop`, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in Antigravity: <step>. <reason>.`, then go on. Do not stop, ask, or retry. When a later step needs what the skipped step made, leave a placeholder and name it in the line.

| Cursor | Antigravity |
| --- | --- |
| Cursor Automations and their webhooks | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads; triage them with `gh`. Skip steps that start or configure Bugbot. |
| `/loop` | Re-run the step yourself at the cadence the skill names, inside this turn's budget. |
| A built-in PR tool | `gh pr create` and friends. Not a skip. |
| `cursor-team-kit` `/deslop`, `control-ui`, `control-cli` | Not installed. Use the mapping in tinderbox's `delivery` skill. |
