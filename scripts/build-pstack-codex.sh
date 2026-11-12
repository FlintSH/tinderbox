#!/usr/bin/env bash
# Build a Codex plugin from upstream pstack at the commit pinned in upstream/sources.json.
# Output: a local Codex marketplace "tinderbox-pstack" holding plugin "pstack".
#   - upstream skills, agents, docs, README and LICENSE, unmodified
#   - agents/openai.yaml with allow_implicit_invocation: false for every skill
#     upstream marks disable-model-invocation, so they stay manual-only like in Claude Code
#   - docs/harness/codex.md, tinderbox's adapter for Cursor names
# Usage: scripts/build-pstack-codex.sh [out-dir]   (default ~/.local/share/tinderbox/pstack-codex)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATE="${HOME}/.local/share/tinderbox"
OUT="${1:-$STATE/pstack-codex}"
SRC="$STATE/sources/cursor-plugins"
PIN="$(python3 -c "import json,sys;print(next(p['pin'] for p in json.load(open(sys.argv[1]))['plugins'] if p['name']=='pstack'))" "$ROOT/upstream/sources.json")"

if [ ! -d "$SRC/.git" ]; then git clone -q --filter=blob:none https://github.com/cursor/plugins.git "$SRC"; fi
git -C "$SRC" fetch -q origin "$PIN"
git -C "$SRC" -c advice.detachedHead=false checkout -q "$PIN"
VERSION="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['version'])" "$SRC/pstack/plugin.json")"

P="$OUT/plugins/pstack"
rm -rf "$OUT"; mkdir -p "$P/.codex-plugin" "$OUT/.agents/plugins"
cp -R "$SRC/pstack/skills" "$SRC/pstack/agents" "$SRC/pstack/docs" "$SRC/pstack/README.md" "$SRC/pstack/LICENSE" "$P/"
[ -d "$SRC/pstack/assets" ] && cp -R "$SRC/pstack/assets" "$P/"
mkdir -p "$P/docs/harness"; cp "$ROOT/upstream/pstack-codex/codex.md" "$P/docs/harness/codex.md"

# Add the adapter pointer to the same skills upstream wraps in its generated Claude Code tree.
LINE='In Codex, read [the Codex adapter](../../docs/harness/codex.md) once per session before you follow this skill. It maps the Cursor names in pstack skills to Codex.'
wrapped=0
for f in "$P"/skills/*/SKILL.md; do
  n="$(basename "$(dirname "$f")")"
  if grep -q 'read \[the Claude Code adapter\]' "$SRC/harness/pstack/claude-code/skills/$n/SKILL.md" 2>/dev/null; then
    LINE="$LINE" python3 - "$f" <<'PY'
import os, re, sys
p = sys.argv[1]; t = open(p).read()
t2 = re.sub(r"^(# .*)\n+", lambda m: m.group(1) + "\n\n" + os.environ["LINE"] + "\n\n", t, count=1, flags=re.M)
assert t2 != t, p
open(p, "w").write(t2)
PY
    wrapped=$((wrapped+1))
  fi
done

manual=0
for f in "$P"/skills/*/SKILL.md; do
  if awk '/^---$/{n++; next} n==1 && /^disable-model-invocation:[ ]*true/{found=1} END{exit !found}' "$f"; then
    d="$(dirname "$f")/agents"; mkdir -p "$d"
    [ -e "$d/openai.yaml" ] && { echo "upstream now ships $d/openai.yaml; merge by hand" >&2; exit 1; }
    printf 'policy:\n  allow_implicit_invocation: false\n' > "$d/openai.yaml"; manual=$((manual+1))
  fi
done

cat > "$P/.codex-plugin/plugin.json" <<JSON
{
  "name": "pstack",
  "version": "$VERSION",
  "description": "Lauren Tan's pstack (cursor/plugins @ ${PIN:0:7}) packaged for Codex by FlintSH/tinderbox. Skills are upstream; read docs/harness/codex.md for Cursor-name mapping.",
  "author": {"name": "Lauren Tan"},
  "homepage": "https://github.com/cursor/plugins/tree/main/pstack",
  "license": "MIT",
  "skills": "./skills/",
  "interface": {"displayName": "pstack", "shortDescription": "Rigorous agent playbooks: go deep first, verify everything", "category": "Developer Tools"}
}
JSON
cat > "$OUT/.agents/plugins/marketplace.json" <<JSON
{
  "name": "tinderbox-pstack",
  "plugins": [
    {"name": "pstack", "source": {"source": "local", "path": "./plugins/pstack"}, "policy": {"installation": "AVAILABLE", "authentication": "ON_USE"}, "category": "Developer Tools"}
  ]
}
JSON
echo "built pstack $VERSION (${PIN:0:7}) for Codex at $OUT: $(ls "$P/skills" | wc -l) skills, $manual manual-only, $wrapped with the adapter line"
