#!/usr/bin/env bash
# Commit and push live agent-setup changes to tinderbox. Run by the
# tinderbox-autosync systemd user timer (scripts/install.sh --autosync).
#
# Works in its own clone ($TINDERBOX_AUTOSYNC_DIR) so it never touches a
# checkout you are editing. Each run: reset the clone to origin/main, run
# sync-from-vm.sh, run check.sh, then commit and push if anything changed.
# A failed check blocks the push and is logged. Files only you write in the
# repo (README, docs, scripts) are never overwritten by a sync.
#
#   scripts/autosync.sh            sync, commit, push
#   scripts/autosync.sh --dry-run  sync and show the diff, no commit or push
set -euo pipefail
if [ -f "$HOME/.config/tinderbox/env" ]; then . "$HOME/.config/tinderbox/env"; fi
BRANCH="${TINDERBOX_BRANCH:-main}"
CLONE="${TINDERBOX_AUTOSYNC_DIR:-$HOME/.local/share/tinderbox/autosync}"
QUIET="${TINDERBOX_QUIET_SECONDS:-120}"
DRY=0; [ "${1:-}" = "--dry-run" ] && DRY=1

# The repo to push to: TINDERBOX_REMOTE, else the clone's own origin.
REMOTE="${TINDERBOX_REMOTE:-$(git -C "$CLONE" remote get-url origin 2>/dev/null || true)}"
[ -n "$REMOTE" ] || { echo "set TINDERBOX_REMOTE (scripts/install.sh --autosync does this)" >&2; exit 1; }

# go-public.sh takes the same lock while it moves the repo.
exec 9>"${XDG_RUNTIME_DIR:-/tmp}/tinderbox-autosync.lock"
flock -n 9 || { echo "another autosync is running"; exit 0; }

# Wait out edits in progress so a half-written skill is not committed. The
# harness-managed skill folders refresh on their own and are not watched.
watch=()
for p in "$HOME/.agents/skills" "$HOME/.claude/skills" "$HOME/.codex/skills" \
  "$HOME/.claude/CLAUDE.md" "$HOME/.codex/AGENTS.md" "$HOME/.claude/rules" "${TINDERBOX_PLUGIN_SRC:-}"; do
  if [ -n "$p" ] && [ -e "$p" ]; then watch+=("$p"); fi
done
newest=""
if [ "${#watch[@]}" -gt 0 ]; then
  newest="$( { find -L "${watch[@]}" \( -path '*/skills/synced' -o -path '*/skills/.system' \) -prune \
    -o -type f -printf '%T@\n' 2>/dev/null || true; } | sort -n | tail -1)"
fi
newest="${newest%.*}"
if [ "$DRY" = 0 ] && [ -n "$newest" ] && [ $(( $(date +%s) - newest )) -lt "$QUIET" ]; then
  echo "last change $(( $(date +%s) - newest ))s ago, waiting for ${QUIET}s of quiet"; exit 0
fi

if [ ! -d "$CLONE/.git" ]; then
  mkdir -p "$(dirname "$CLONE")"
  git clone -q --branch "$BRANCH" "$REMOTE" "$CLONE"
fi
cd "$CLONE"
# Never push somewhere other than the configured repo.
norm() { sed -E 's#(\.git)?/*$##; s#^git@github\.com:#https://github.com/#' <<<"$1"; }
for url in $(git remote get-url origin) $(git remote get-url --push --all origin); do
  if [ "$(norm "$url")" != "$(norm "$REMOTE")" ]; then
    echo "the autosync clone's origin uses $url, not $REMOTE; fix one of them" >&2
    exit 1
  fi
done
git fetch -q origin "$BRANCH"
git checkout -q -B "$BRANCH" "origin/$BRANCH"
git reset -q --hard "origin/$BRANCH"
git clean -qfd

scripts/sync-from-vm.sh
git add -A
if git diff --cached --quiet; then echo "no changes"; exit 0; fi

# Skill changes move the README counts and lists, so re-render it.
# A failed render is logged and the sync still ships.
if git diff --cached --name-only | grep -qE '^(skills|plugins)/|^upstream/sources.json$'; then
  if (cd readme && { [ -d node_modules ] || npm ci --silent; } && node render.mjs); then
    git add -A
  else
    echo "warning: README render failed; README and images not updated"
  fi
fi

if ! scripts/check.sh; then
  echo "check failed; nothing pushed. Changed paths:"; git diff --cached --stat
  exit 1
fi

changed="$(git diff --cached --name-only)"
# One short subject naming what moved, e.g. "Sync skills/foo, router/core.md".
areas="$(sed -E 's#^(skills|plugins/[^/]+/skills)/([^/]+)/.*#\1/\2#; s#^(plugins/[^/]+)/.*#\1#' <<<"$changed" | sort -u)"
subject="Sync $(head -4 <<<"$areas" | paste -sd, - | sed 's/,/, /g')"
[ "$(wc -l <<<"$areas")" -gt 4 ] && subject+=" and more"

if [ "$DRY" = 1 ]; then
  echo "would commit: $subject"; git --no-pager diff --cached --stat; git reset -q --hard; exit 0
fi

stat="$(git diff --cached --shortstat | sed 's/^ *//')"
git commit -q -m "$subject" -m "Automatic sync from the live setup. $stat"
git push -q origin "HEAD:$BRANCH"
echo "pushed $(git rev-parse --short HEAD): $subject"

# Release what was just pushed (see docs/AUTOSYNC.md, "Releases"):
#   TINDERBOX_RELEASE=t3     POST to TINDERBOX_RELEASE_WEBHOOK, a T3 scheduled task
#                            where a small model writes the notes and runs
#                            scripts/release.sh; falls back to plain if the POST fails
#   TINDERBOX_RELEASE=plain  release now with commit subjects as the notes
#   unset or off             no releases
SHA="$(git rev-parse HEAD)"
case "${TINDERBOX_RELEASE:-off}" in
  t3)
    if [ -n "${TINDERBOX_RELEASE_WEBHOOK:-}" ] && curl -fsS -m 20 -X POST -H 'content-type: application/json' \
      -d "{\"repo\":\"$REMOTE\",\"sha\":\"$SHA\"}" "$TINDERBOX_RELEASE_WEBHOOK" >/dev/null; then
      echo "release requested from T3 for ${SHA:0:12}"
    else
      echo "warning: T3 release webhook failed; releasing with plain notes"
      scripts/release.sh publish "$SHA" --plain || echo "warning: release failed"
    fi ;;
  plain) scripts/release.sh publish "$SHA" --plain || echo "warning: release failed" ;;
esac
