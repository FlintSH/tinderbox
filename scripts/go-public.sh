#!/usr/bin/env bash
# Publish tinderbox as a new public repo with exactly one commit.
#
#   scripts/go-public.sh OWNER/REPO [--yes]
#
# 1. Clones OWNER/REPO's main branch, checks it is the split layout and passes
#    the same scripts/check.sh as this checkout.
# 2. Pauses autosync (timer stopped, its lock held) for the whole move.
# 3. Renames the private repo to REPO-archive (stays private, history intact).
# 4. Creates a new public OWNER/REPO and pushes that exact tree as one commit.
# 5. Re-points the autosync clone at the new repo and resumes autosync.
#
# Nothing old is pushed, so earlier commits cannot be fetched from the public
# repo. If a step fails, it undoes what it can and prints what is left to do.
set -euo pipefail
SLUG="${1:?usage: scripts/go-public.sh OWNER/REPO [--yes]}"
YES="${2:-}"
BRANCH=main
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OWNER="${SLUG%/*}"; NAME="${SLUG#*/}"; ARCHIVE="$NAME-archive"
CLONE="${TINDERBOX_AUTOSYNC_DIR:-$HOME/.local/share/tinderbox/autosync}"
WORK="$(mktemp -d)"
STAGE=start; TIMER_WAS_ACTIVE=0

finish() {
  local code=$?
  if [ "$code" != 0 ]; then
    echo
    echo "go-public stopped during: $STAGE"
    case "$STAGE" in
      renamed)
        echo "Renaming $OWNER/$ARCHIVE back to $SLUG"
        gh repo rename "$NAME" -R "$OWNER/$ARCHIVE" --yes || echo "  failed; run: gh repo rename $NAME -R $OWNER/$ARCHIVE --yes" ;;
      created)
        echo "The new public $SLUG exists but has no commit. The private history is in $OWNER/$ARCHIVE."
        echo "Retry the push: git -C $WORK/pub push https://github.com/$SLUG.git main"
        echo "or delete $SLUG on github.com and run: gh repo rename $NAME -R $OWNER/$ARCHIVE --yes"
        echo "Kept $WORK for that." ; WORK="" ;;
    esac
  fi
  [ -n "$WORK" ] && rm -rf "$WORK"
  if [ "$TIMER_WAS_ACTIVE" = 1 ]; then systemctl --user start tinderbox-autosync.timer || true; fi
}
trap finish EXIT

command -v gh >/dev/null && gh auth status >/dev/null 2>&1 || { echo "gh is not authenticated" >&2; exit 1; }
[ "$(gh repo view "$SLUG" --json visibility --jq .visibility)" = "PRIVATE" ] || { echo "$SLUG is not a private repo" >&2; exit 1; }
if gh repo view "$OWNER/$ARCHIVE" >/dev/null 2>&1; then echo "$OWNER/$ARCHIVE already exists" >&2; exit 1; fi

echo "== checking $SLUG@$BRANCH"
git clone -q --branch "$BRANCH" "https://github.com/$SLUG.git" "$WORK/src"
SHA="$(git -C "$WORK/src" rev-parse HEAD)"
for f in router/core.md scripts/router.py LICENSE NOTICE; do
  [ -f "$WORK/src/$f" ] || { echo "$BRANCH has no $f; merge the generalized layout first" >&2; exit 1; }
done
cmp -s "$ROOT/scripts/check.sh" "$WORK/src/scripts/check.sh" || { echo "$BRANCH's check.sh differs from this checkout's; pull or push first" >&2; exit 1; }
(cd "$WORK/src" && scripts/check.sh)
DESC="$(sed -n '/^## tagline$/{n;p;q}' "$WORK/src/readme/copy.md")"

echo
echo "This will:"
echo "  - rename $SLUG to $OWNER/$ARCHIVE (stays private, keeps all history)"
echo "  - create a new PUBLIC $SLUG with one commit: the tree of $BRANCH at ${SHA:0:12} ($(git -C "$WORK/src" ls-files | wc -l) files)"
echo "  - description: $DESC"
if [ "$YES" != "--yes" ]; then
  read -r -p "Type $SLUG to continue: " answer
  [ "$answer" = "$SLUG" ] || { echo "aborted"; exit 1; }
fi

echo "== pausing autosync"
if systemctl --user is-active -q tinderbox-autosync.timer 2>/dev/null; then TIMER_WAS_ACTIVE=1; systemctl --user stop tinderbox-autosync.timer; fi
exec 9>"${XDG_RUNTIME_DIR:-/tmp}/tinderbox-autosync.lock"
flock -w 600 9 || { echo "an autosync run did not finish within 10 minutes" >&2; exit 1; }
# The tree must not have moved while we waited.
[ "$(git ls-remote "https://github.com/$SLUG.git" "refs/heads/$BRANCH" | cut -f1)" = "$SHA" ] || { echo "$BRANCH moved during the wait; rerun" >&2; exit 1; }

echo "== one-commit tree"
mkdir "$WORK/pub"
git -C "$WORK/src" archive "$SHA" | tar -x -C "$WORK/pub"
git -C "$WORK/pub" init -q -b main
git -C "$WORK/pub" add -A
git -C "$WORK/pub" -c user.name="$(git -C "$ROOT" config user.name)" -c user.email="$(git -C "$ROOT" config user.email)" \
  commit -q -m "tinderbox"

echo "== archive and publish"
gh repo rename "$ARCHIVE" -R "$SLUG" --yes; STAGE=renamed
gh repo create "$SLUG" --public --description "$DESC" --disable-wiki; STAGE=created
git -C "$WORK/pub" push -q "https://github.com/$SLUG.git" main; STAGE=published
gh repo view "$SLUG" --json url,visibility,defaultBranchRef --jq '"\(.url) \(.visibility) \(.defaultBranchRef.name)"'

if [ -d "$CLONE/.git" ]; then
  git clone -q "https://github.com/$SLUG.git" "$WORK/autosync-new"
  git -C "$WORK/autosync-new" remote set-url origin "$(git -C "$CLONE" remote get-url origin)"
  rm -rf "$CLONE" && mv "$WORK/autosync-new" "$CLONE"
  echo "autosync clone now tracks the public repo"
fi
STAGE=done

echo
echo "Done. Existing checkouts still have the old history. In each clean one run:"
echo "  git fetch origin && git checkout -B main origin/main"
echo "The old history stays in $OWNER/$ARCHIVE."
