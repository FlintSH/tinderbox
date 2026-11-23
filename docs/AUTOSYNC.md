# Autosync

Autosync pushes to `main` of the repo it was installed from, so install it from
**your own fork** of tinderbox, never from a clone of someone else's.

The live setup on your machine is the source of truth. A systemd user timer pushes
it here so the repo never drifts.

```sh
scripts/install.sh --autosync          # once per machine; shows what it would publish and asks
scripts/autosync.sh --dry-run          # what the next run would commit
journalctl --user -u tinderbox-autosync
systemctl --user disable --now tinderbox-autosync.timer   # pause it
```

Every 10 minutes, `scripts/autosync.sh`:

1. Skips the run if anything in the watched paths changed in the last two
   minutes, so a skill a model is still writing is not committed half done.
2. Resets its own clone (`~/.local/share/tinderbox/autosync`) to `origin/main`.
   It never touches a checkout you are editing.
3. Runs `scripts/sync-from-vm.sh`, then `scripts/check.sh`. A failed check
   (frontmatter, JSON, a token, an AI attribution line) blocks the push and
   shows up in the journal.
4. If skills changed, re-renders the README panels (`readme/render.mjs`,
   headless Chrome) so counts and lists stay right. A failed render is logged
   and the sync still ships.
5. Commits as `Sync <paths>` and pushes to `main`.

## Configure

`~/.config/tinderbox/env` (optional, sourced by the sync) sets
`TINDERBOX_PLUGIN_SRC` when you keep the plugin outside the repo,
`TINDERBOX_PATCH_SRC` for a folder of `*.patch` files to copy into
`upstream/patches/`, and `TINDERBOX_PERSONAL`.
Set `TINDERBOX_PERSONAL=<name>` only if you want your own rules (everything
outside the tinderbox block) published as `router/personal/<name>.md`; unset,
they stay on your machine. `TINDERBOX_REMOTE` (in the systemd unit) is the
repo autosync pushes to.

## What syncs

| Live path | Repo path |
| --- | --- |
| Any skill folder with a `SKILL.md` in `~/.agents/skills`, `~/.claude/skills`, `~/.codex/skills` | `skills/<name>/` |
| A pinned third-party skill whose live copy differs from upstream | `skills/<name>/` |
| `$TINDERBOX_PLUGIN_SRC/plugins/tinderbox`, when set | `plugins/tinderbox/` |
| the tinderbox block in `~/.claude/CLAUDE.md` / `~/.codex/AGENTS.md` | `router/core.md` |
| everything else in that file, only when `TINDERBOX_PERSONAL` is set | `router/personal/$TINDERBOX_PERSONAL.md` |
| rule files tinderbox ships (`router/claude-rules/*.md`), `~/.codex/pstack-models.md` | `router/claude-rules/`, `router/codex/` |
| `~/.gemini/config/pstack-models.md`, `~/.gemini/config/pstack-antigravity.md` (Antigravity) | `router/antigravity/` |
| enabled plugins, marketplaces, MCP server names | `upstream/installed.json` |

Skills are discovered, so a skill a model writes into `~/.agents/skills` shows
up here on the next run. Third-party skills named in `upstream/sources.json`
are skipped while they match their pinned upstream (with any overlay). Once
you change one, the whole live skill is published as `skills/<name>/` and the
README lists it as modified; `install.sh --upstream` then leaves it to
`--skills`. Revert it to upstream and `skills/<name>/` is removed. To keep a skill local, add its folder name to `sync.ignore` (in
the repo) or `~/.config/tinderbox/sync.ignore` (on the machine, for names you
would rather not publish at all). A skill removed from the machine is reported, not
deleted here.

Edits made only in the repo to a synced path are overwritten on the next run.
Change the live copy instead, or run `scripts/install.sh --skills` after
pulling. README, docs and scripts are repo-only and never overwritten.

## Releases

Every autosync push can cut a GitHub release, versioned by date (`v2026.11.12`,
then `v2026.11.12.2`). `scripts/release.sh` does the mechanics: it finds what
reached `main` since the last release, refuses SHAs that are not on `main` or
already released, and checks the notes for anything that looks like a secret.
Set one of these in `~/.config/tinderbox/env`:

- `TINDERBOX_RELEASE=t3` plus `TINDERBOX_RELEASE_WEBHOOK=<url>`: autosync posts
  to a T3 scheduled task with a webhook trigger. In that run a small model reads `scripts/release.sh status`,
  writes 2 to 6 bullets and runs `scripts/release.sh publish`. If the post
  fails, autosync releases with plain notes instead. Keep the webhook URL out
  of the repo; it works like a password.
- `TINDERBOX_RELEASE=plain`: release straight away, notes are commit subjects.
- unset: no releases.

Releases only cover autosync pushes; anything pushed by hand in between is
included in the next one.
