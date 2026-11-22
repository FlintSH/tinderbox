#!/usr/bin/env bash
# Validate skills, manifests and scripts, and scan for secrets. Run before every push.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
fail=0; err() { echo "FAIL: $*"; fail=1; }

for f in skills/*/SKILL.md plugins/*/skills/*/SKILL.md; do
  dir="$(basename "$(dirname "$f")")"
  head -1 "$f" | grep -qx -- '---' || err "$f: no frontmatter"
  name="$(awk '/^---$/{n++; next} n==1 && /^name:/{sub(/^name:[ ]*/,""); print; exit}' "$f")"
  [ "$name" = "$dir" ] || err "$f: name '$name' does not match folder '$dir'"
  awk '/^---$/{n++; next} n==1 && /^description:/{found=1} END{exit !found}' "$f" || err "$f: no description"
done

for j in $(git ls-files --cached --others --exclude-standard '*.json'); do
  python3 -m json.tool "$j" >/dev/null 2>&1 || err "$j: invalid JSON"
done

for s in scripts/*.sh; do bash -n "$s" || err "$s: syntax"; done

# Plugin versions must agree across both harness manifests and the marketplace.
v1=$(python3 -c "import json;print(json.load(open('plugins/tinderbox/.claude-plugin/plugin.json'))['version'])")
v2=$(python3 -c "import json;print(json.load(open('plugins/tinderbox/.codex-plugin/plugin.json'))['version'])")
v3=$(python3 -c "import json;print(json.load(open('.claude-plugin/marketplace.json'))['plugins'][0]['version'])")
[ "$v1" = "$v2" ] && [ "$v1" = "$v3" ] || err "plugin versions differ: $v1 $v2 $v3"

if git ls-files --cached --others --exclude-standard -z | xargs -0 grep -IlE \
  '(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-(ant-)?[A-Za-z0-9_-]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY)' 2>/dev/null; then
  err "possible secret in the files above"
fi

if git ls-files --cached --others --exclude-standard -z | xargs -0 grep -IlE '^(Co-Authored-By: Claude|.{0,3}Generated with \[?Claude)' 2>/dev/null | grep -v '^scripts/check.sh$'; then
  err "AI attribution text in the files above"
fi

# The generic parts must stay generic. Home-directory paths never belong there;
# names in check.deny (the owner's people, products and machines) belong in
# router/personal/ or upstream/patches/personal/ instead.
deny='/home/[a-z]|/Users/[A-Za-z]'
if [ -f check.deny ]; then
  words="$(sed -e 's/[[:space:]]*#.*//' -e '/^$/d' check.deny | paste -sd'|' -)"
  [ -n "$words" ] && deny="$deny|$words"
fi
if git ls-files --cached --others --exclude-standard -z -- plugins skills scripts router/core.md router/claude-rules router/codex router/antigravity \
  docs upstream/pstack-codex upstream/patches upstream/overlays \
  ':!skills/fl1nt-design' ':!skills/visual-polish-loop/references/worked-example.md' \
  ':!skills/visual-polish-loop/references/directions.md' ':!upstream/patches/personal' \
  | xargs -0 grep -nIE "$deny" 2>/dev/null; then
  err "personal references in generic files above (move them to router/personal/, or edit check.deny)"
fi
# Personal layers are published as examples: no home-directory paths in them.
if git ls-files --cached --others --exclude-standard -z -- router/personal | xargs -0 grep -nIE '/home/[a-z]|/Users/[A-Za-z]' 2>/dev/null; then
  err "home-directory paths in router/personal/ above (use ~ or drop them)"
fi

[ "$fail" = 0 ] && echo "check ok"
exit "$fail"
