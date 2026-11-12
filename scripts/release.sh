#!/usr/bin/env bash
# Cut a GitHub release for whatever reached main since the last release.
#
#   scripts/release.sh status              what the next release would contain
#   scripts/release.sh publish SHA NOTES   release SHA with the bullet list in NOTES
#   scripts/release.sh publish SHA --plain release SHA with commit subjects as notes
#
# Versions are dates: v2026.11.12, then v2026.11.12.2 for a second release that
# day. `status` exits 3 when there is nothing new. `publish` refuses a SHA that is
# not on origin/main or is already released, and notes that are empty, too long,
# or contain a token. Release notes are short bullets ("- ...") only.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
BRANCH="${TINDERBOX_BRANCH:-main}"
git fetch -q --tags origin "$BRANCH"
HEAD_SHA="$(git rev-parse "origin/$BRANCH")"
LAST="$(git describe --tags --abbrev=0 --match 'v[0-9]*' "origin/$BRANCH" 2>/dev/null || true)"
RANGE="${LAST:+$LAST..}$HEAD_SHA"

next_version() {
  local base n=2 v
  base="v$(date -u +%Y.%-m.%-d)"; v="$base"
  while git rev-parse -q --verify "refs/tags/$v" >/dev/null || gh release view "$v" >/dev/null 2>&1; do v="$base.$n"; n=$((n + 1)); done
  echo "$v"
}

case "${1:-}" in
  status)
    if [ -n "$LAST" ] && [ -z "$(git rev-list "$RANGE")" ]; then echo "nothing new since $LAST"; exit 3; fi
    echo "version: $(next_version)"
    echo "sha: $HEAD_SHA"
    echo "previous: ${LAST:-none}"
    echo
    echo "## commits"
    git log --format='- %s' "$RANGE"
    echo
    echo "## files"
    git diff --stat=100 "${LAST:-$(git hash-object -t tree /dev/null)}" "$HEAD_SHA" | tail -40
    echo
    echo "## changes to skills and rules (trimmed)"
    git diff --unified=1 "${LAST:-$(git hash-object -t tree /dev/null)}" "$HEAD_SHA" -- \
      skills plugins router docs scripts ':!skills/fl1nt-design/assets' ':!skills/fl1nt-design/references' \
      | grep -E '^(diff --git|[-+][^-+])' | cut -c1-160 | head -400
    ;;
  publish)
    SHA="${2:?publish needs a SHA}"; NOTES="${3:?publish needs a notes file or --plain}"
    git merge-base --is-ancestor "$SHA" "origin/$BRANCH" || { echo "$SHA is not on origin/$BRANCH" >&2; exit 1; }
    if [ -n "$LAST" ] && git merge-base --is-ancestor "$SHA" "$LAST"; then echo "$SHA is already in $LAST" >&2; exit 1; fi
    TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
    if [ "$NOTES" = "--plain" ]; then
      git log --format='- %s' "${LAST:+$LAST..}$SHA" | head -20 > "$TMP"
    else
      # Keep only bullet lines; normalise long dashes to the house style.
      grep -E '^- ' "$NOTES" | sed 's/ — / - /g; s/—/-/g' > "$TMP" || true
    fi
    lines="$(wc -l < "$TMP")"
    [ "$lines" -ge 1 ] && [ "$lines" -le 12 ] || { echo "notes need 1 to 12 '- ' bullet lines, got $lines" >&2; exit 1; }
    if grep -qE '(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_|sk-(ant-)?[A-Za-z0-9_-]{30,}|AKIA[0-9A-Z]{16}|PRIVATE KEY)' "$TMP"; then
      echo "notes contain something that looks like a secret" >&2; exit 1
    fi
    VERSION="$(next_version)"
    {
      cat "$TMP"
      if [ -n "$LAST" ]; then echo; echo "<sub>[changes since $LAST](../../compare/$LAST...$VERSION)</sub>"; fi
    } > "$TMP.body"
    gh release create "$VERSION" --target "$SHA" --title "$VERSION" --notes-file "$TMP.body"
    rm -f "$TMP.body"
    echo "released $VERSION at ${SHA:0:12}"
    ;;
  *) sed -n 2,11p "$0"; exit 2 ;;
esac
