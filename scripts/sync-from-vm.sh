#!/usr/bin/env bash
# Refresh this repo from the live agent setup on this machine. The live copies
# are the source of truth; this only writes paths that mirror them.
#
# Where things live is configurable in ~/.config/tinderbox/env (sourced if it
# exists):
#   TINDERBOX_PLUGIN_SRC  folder holding plugins/tinderbox and the marketplace
#                         files (default: this repo, i.e. edited in place)
#   TINDERBOX_PATCH_SRC   folder of *.patch files to copy into upstream/patches
#   TINDERBOX_PERSONAL    publish your own rules (everything outside the block)
#                         as router/personal/<name>.md. Unset: they stay local.
#
# Skills are discovered, not listed: any folder with a SKILL.md in
# ~/.agents/skills, ~/.claude/skills or ~/.codex/skills is copied to skills/,
# unless it is third-party (named in upstream/sources.json) or listed in
# sync.ignore or ~/.config/tinderbox/sync.ignore (one name per line, # comments).
# Skills missing from this machine are reported, never deleted.
#
# The global instruction files hold the tinderbox block (router/core.md) and,
# around it, your own rules (router/personal/<name>.md, only when opted in).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
H="${HOME}"
if [ -f "$H/.config/tinderbox/env" ]; then . "$H/.config/tinderbox/env"; fi
PLUGIN_SRC="${TINDERBOX_PLUGIN_SRC:-$ROOT}"
PATCH_SRC="${TINDERBOX_PATCH_SRC:-}"
PERSONAL="${TINDERBOX_PERSONAL:-}"
if [ -n "$PERSONAL" ] && ! [[ "$PERSONAL" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "TINDERBOX_PERSONAL must be a lowercase name like 'alex' (it names router/personal/<name>.md)" >&2; exit 1
fi
SKILL_ROOTS=("$H/.agents/skills" "$H/.claude/skills" "$H/.codex/skills")

copy_dir() {
  local tmp; tmp="$(mktemp -d)"
  cp -RL "$1" "$tmp/x"
  find "$tmp/x" \( -name __pycache__ -o -name .DS_Store -o -name node_modules \) -prune -exec rm -rf {} +
  rm -rf "$2"; mkdir -p "$(dirname "$2")"; mv "$tmp/x" "$2"; rmdir "$tmp"
}

# Names to skip: third-party skills plus both ignore files.
skip="$(python3 - "$ROOT/upstream/sources.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
for src in d.get("skills", []):
    for s in src.get("skills", []):
        print(s if isinstance(s, str) else s["name"])
PY
)"
for f in "$ROOT/sync.ignore" "$H/.config/tinderbox/sync.ignore"; do
  [ -f "$f" ] && skip+=$'\n'"$(sed -e 's/#.*//' -e 's/[[:space:]]*$//' "$f" | grep -v '^$' || true)"
done
skip+=$'\n'"synced"$'\n'".system"

declare -A seen=()
for r in "${SKILL_ROOTS[@]}"; do
  [ -d "$r" ] || continue
  for d in "$r"/*/; do
    d="${d%/}"; name="$(basename "$d")"
    [ -f "$d/SKILL.md" ] || continue
    [ -n "${seen[$name]:-}" ] && continue
    grep -qxF -- "$name" <<<"$skip" && continue
    seen[$name]=1
    [ -d "$ROOT/skills/$name" ] || echo "new skill: $name (from $d)"
    copy_dir "$d" "$ROOT/skills/$name"
  done
done
for d in "$ROOT"/skills/*/; do
  name="$(basename "$d")"
  [ -n "${seen[$name]:-}" ] || echo "warning: skills/$name is no longer installed here (left in place)"
done

# The tinderbox plugin, when it is maintained outside the repo.
if [ "$(cd "$PLUGIN_SRC" && pwd)" != "$ROOT" ]; then
  copy_dir "$PLUGIN_SRC/plugins/tinderbox" "$ROOT/plugins/tinderbox"
  for m in .claude-plugin/marketplace.json .agents/plugins/marketplace.json; do
    if [ -f "$PLUGIN_SRC/$m" ]; then mkdir -p "$ROOT/$(dirname "$m")"; cp "$PLUGIN_SRC/$m" "$ROOT/$m"; fi
  done
fi

# Global instructions: the managed block becomes router/core.md, the rest is the
# personal layer. Both harness files carry the same text; CLAUDE.md wins.
python3 "$ROOT/scripts/router.py" split "$H/.claude/CLAUDE.md" "$H/.codex/AGENTS.md" \
  --core "$ROOT/router/core.md" ${PERSONAL:+--personal "$ROOT/router/personal/$PERSONAL.md"}

mkdir -p "$ROOT/router/claude-rules" "$ROOT/router/codex" "$ROOT/upstream/patches"
# Only the rule files tinderbox ships; other rules in ~/.claude/rules stay local.
for f in "$ROOT"/router/claude-rules/*.md; do
  src="$H/.claude/rules/$(basename "$f")"; if [ -f "$src" ]; then cp "$src" "$f"; fi
done
if [ -f "$H/.codex/pstack-models.md" ]; then cp "$H/.codex/pstack-models.md" "$ROOT/router/codex/pstack-models.md"; fi
mkdir -p "$ROOT/router/antigravity"
for f in pstack-models.md pstack-antigravity.md; do
  if [ -f "$H/.gemini/config/$f" ]; then cp "$H/.gemini/config/$f" "$ROOT/router/antigravity/$f"; fi
done
# Patches go back where they already live: upstream/patches/personal/ for
# opt-in personal ones, upstream/patches/ otherwise.
if [ -n "$PATCH_SRC" ]; then
  for f in "$PATCH_SRC"/*.patch; do
    [ -f "$f" ] || continue
    if [ -f "$ROOT/upstream/patches/personal/$(basename "$f")" ]; then cp "$f" "$ROOT/upstream/patches/personal/"; else cp "$f" "$ROOT/upstream/patches/"; fi
  done
fi

# Which plugins and marketplaces are enabled, without the rest of the settings
# files (they can hold env vars and tokens).
python3 - "$H" "$ROOT/upstream/installed.json" <<'PY'
import json, re, sys
home, out = sys.argv[1], sys.argv[2]
snap = {"note": "Generated by scripts/sync-from-vm.sh. What is enabled on the machine it last ran on."}
try:
    s = json.load(open(f"{home}/.claude/settings.json"))
    snap["claude"] = {
        "plugins": sorted(k for k, v in s.get("enabledPlugins", {}).items() if v),
        "marketplaces": {k: v.get("source", {}).get("repo") or v.get("source", {}).get("source")
                          for k, v in sorted(s.get("extraKnownMarketplaces", {}).items())},
    }
except FileNotFoundError:
    pass
try:
    t = open(f"{home}/.codex/config.toml").read()
    snap["codex"] = {
        "plugins": sorted(m.group(1) for m in re.finditer(r'^\[plugins\."([^"]+)"\]\s*\nenabled\s*=\s*true', t, re.M)),
        "mcp_servers": sorted(set(re.findall(r'^\[mcp_servers\.([\w-]+)\]', t, re.M))),
    }
except FileNotFoundError:
    pass
open(out, "w").write(json.dumps(snap, indent=2) + "\n")
PY

echo "synced into $ROOT. Review with: git -C $ROOT status"
