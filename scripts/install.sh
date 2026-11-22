#!/usr/bin/env bash
# Install tinderbox into Claude Code (~/.claude), Codex (~/.agents, ~/.codex) and Antigravity (~/.gemini).
#
#   scripts/install.sh --skills     tinderbox's own skills: real copies in ~/.agents/skills, symlinks in ~/.claude/skills
#   scripts/install.sh --upstream   Pinned third-party git skills from upstream/sources.json
#                                   (TINDERBOX_PERSONAL_PATCHES=1 also applies upstream/patches/personal/)
#   scripts/install.sh --plugin     the tinderbox plugin (delivery, visual-qa, pr-follow-through, render-qa) for Claude Code and Codex
#   scripts/install.sh --pstack     pstack for Claude Code (cursor/plugins) and Codex (built locally), plus model sheets
#   scripts/install.sh --router     router/core.md as a managed block in ~/.claude/CLAUDE.md and ~/.codex/AGENTS.md; your own rules stay
#   scripts/install.sh --antigravity  Antigravity (agy): skill symlinks, the router block, pstack sheets and Context7 in ~/.gemini/config
#   scripts/install.sh --autosync   systemd user timer that pushes live changes back here (scripts/autosync.sh)
#   scripts/install.sh --all        everything except --router, --antigravity and --autosync
#   add --dry-run to print actions without changing anything
#
# Files in upstream/overlays/<skill>/ are copied over that skill after install.
# Anything replaced is moved to ~/.local/share/tinderbox/backup/<timestamp>/ first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATE="${HOME}/.local/share/tinderbox"
BACKUP="$STATE/backup/$(date +%Y%m%d-%H%M%S)"
AGENTS_SKILLS="${HOME}/.agents/skills"
CLAUDE_SKILLS="${HOME}/.claude/skills"
DRY=0; DO_SKILLS=0; DO_UP=0; DO_PLUGIN=0; DO_PSTACK=0; DO_ROUTER=0; DO_AUTOSYNC=0; DO_AGY=0

for a in "$@"; do
  case "$a" in
    --skills) DO_SKILLS=1 ;; --upstream) DO_UP=1 ;; --plugin) DO_PLUGIN=1 ;;
    --pstack) DO_PSTACK=1 ;; --router) DO_ROUTER=1 ;; --autosync) DO_AUTOSYNC=1 ;;
    --antigravity) DO_AGY=1 ;;
    --dry-run) DRY=1 ;;
    --all) DO_SKILLS=1; DO_UP=1; DO_PLUGIN=1; DO_PSTACK=1 ;;
    -h|--help) sed -n 2,16p "$0"; exit 0 ;;
    *) echo "unknown option: $a" >&2; exit 2 ;;
  esac
done
[ $((DO_SKILLS+DO_UP+DO_PLUGIN+DO_PSTACK+DO_ROUTER+DO_AUTOSYNC+DO_AGY)) -gt 0 ] || { sed -n 2,16p "$0"; exit 2; }

run() { echo "+ $*"; [ "$DRY" = 1 ] || "$@"; }

# Move an existing path aside unless it already matches the source.
stash() {
  local target="$1" src="${2:-}"
  [ -e "$target" ] || [ -L "$target" ] || return 0
  if [ -n "$src" ] && [ -d "$target" ] && [ ! -L "$target" ] && diff -rq "$src" "$target" >/dev/null 2>&1; then return 0; fi
  run mkdir -p "$BACKUP$(dirname "$target")"
  run mv "$target" "$BACKUP$target"
}

place_skill() {
  local src="$1" name="$2"
  stash "$AGENTS_SKILLS/$name" "$src"
  if [ ! -d "$AGENTS_SKILLS/$name" ]; then run mkdir -p "$AGENTS_SKILLS"; run cp -R "$src" "$AGENTS_SKILLS/$name"; fi
  if [ "$(readlink "$CLAUDE_SKILLS/$name" 2>/dev/null)" != "$AGENTS_SKILLS/$name" ]; then
    stash "$CLAUDE_SKILLS/$name"
    run mkdir -p "$CLAUDE_SKILLS"; run ln -s "$AGENTS_SKILLS/$name" "$CLAUDE_SKILLS/$name"
  fi
}

if [ "$DO_SKILLS" = 1 ]; then
  for d in "$ROOT"/skills/*/; do place_skill "${d%/}" "$(basename "$d")"; done
fi

if [ "$DO_UP" = 1 ]; then
  command -v python3 >/dev/null || { echo "python3 is required for --upstream" >&2; exit 1; }
  PLAN="$(mktemp)"
  python3 - "$ROOT/upstream/sources.json" > "$PLAN" <<'PY'
import json, os, sys
for s in json.load(open(sys.argv[1]))["skills"]:
    if not s["source"].startswith("https://"):
        print("manual", s["name"], s.get("install", "")); continue
    for k in s["skills"]:
        print("git", s["source"], s["pin"], k["name"], k["path"])
    for p in s.get("patches", []):
        print("patch", p)
    if os.environ.get("TINDERBOX_PERSONAL_PATCHES") == "1":
        for p in s.get("personal_patches", []):
            print("patch", p)
PY
  while read -r kind a b c d; do
    case "$kind" in
      git)
        slug="$(basename "$a")-$(basename "$(dirname "$a")")"; dir="$STATE/sources/$slug"
        if [ ! -d "$dir/.git" ]; then run git clone -q "$a" "$dir"; fi
        run git -C "$dir" fetch -q origin "$b"; run git -C "$dir" -c advice.detachedHead=false checkout -q "$b"
        place_skill "$dir/$d" "$c"
        if [ -d "$ROOT/upstream/overlays/$c" ]; then run cp -R "$ROOT/upstream/overlays/$c/." "$AGENTS_SKILLS/$c/"; fi ;;
      patch)
        if [ "$DRY" = 1 ] || patch -p1 -R --dry-run -s -f -d "$AGENTS_SKILLS" < "$ROOT/$a" >/dev/null 2>&1; then
          echo "= $a already applied or dry run"
        else
          run patch -p1 -s -d "$AGENTS_SKILLS" -i "$ROOT/$a"
        fi ;;
      manual) echo "! skip $a $b ($c $d)" ;;
    esac
  done < "$PLAN"
  rm -f "$PLAN"
fi

HAVE_CLAUDE=0; HAVE_CODEX=0
command -v claude >/dev/null && HAVE_CLAUDE=1
command -v codex >/dev/null && HAVE_CODEX=1
if [ $((DO_PLUGIN+DO_PSTACK)) -gt 0 ] && [ $((HAVE_CLAUDE+HAVE_CODEX)) = 0 ]; then
  echo "! neither the claude nor the codex CLI is on PATH; skipping --plugin/--pstack" >&2
fi

if [ "$DO_PLUGIN" = 1 ]; then
  if [ "$HAVE_CLAUDE" = 1 ]; then run claude plugin marketplace add "$ROOT"; run claude plugin install tinderbox@tinderbox; fi
  if command -v codex >/dev/null; then run codex plugin marketplace add "$ROOT" || true; run codex plugin add tinderbox@tinderbox || true; fi
fi

if [ "$DO_PSTACK" = 1 ]; then
  if [ "$HAVE_CLAUDE" = 1 ]; then
    run claude plugin marketplace add cursor/plugins
    run claude plugin install pstack@cursor-plugins
    stash "${HOME}/.claude/rules/pstack-models.md"
    run mkdir -p "${HOME}/.claude/rules"; run cp "$ROOT/router/claude-rules/pstack-models.md" "${HOME}/.claude/rules/"
  fi
  if command -v codex >/dev/null; then
    run "$ROOT/scripts/build-pstack-codex.sh" "$STATE/pstack-codex"
    run codex plugin marketplace add "$STATE/pstack-codex" || true
    run codex plugin add pstack@tinderbox-pstack
    stash "${HOME}/.codex/pstack-models.md"
    run mkdir -p "${HOME}/.codex"; run cp "$ROOT/router/codex/pstack-models.md" "${HOME}/.codex/pstack-models.md"
  fi
fi

if [ "$DO_ROUTER" = 1 ]; then
  command -v python3 >/dev/null || { echo "python3 is required for --router" >&2; exit 1; }
  # Replace only the tinderbox block (added at the top if missing); changed files are backed up first.
  python3 "$ROOT/scripts/router.py" install "$ROOT/router/core.md" "${HOME}/.claude/CLAUDE.md" "${HOME}/.codex/AGENTS.md" \
    --backup "$BACKUP" $([ "$DRY" = 1 ] && echo --dry-run)
  echo "  router/personal/ holds example personal layers; they are not installed."
fi

if [ "$DO_AGY" = 1 ]; then
  command -v python3 >/dev/null || { echo "python3 is required for --antigravity" >&2; exit 1; }
  # Antigravity reads global skills from ~/.gemini/config/skills and has no manual-only flag, so
  # link the auto-routable skills there and leave pstack to be read by path (see the adapter).
  # Links, not copies: edits to the live skills show up without a reinstall.
  AGY="${HOME}/.gemini/config"; AGY_SKILLS="$AGY/skills"
  if [ -f "${HOME}/.config/tinderbox/env" ]; then . "${HOME}/.config/tinderbox/env"; fi
  PLUGIN_SKILLS="${TINDERBOX_PLUGIN_SRC:-$ROOT}/plugins/tinderbox/skills"
  run mkdir -p "$AGY_SKILLS"
  declare -A agy_seen=()
  for d in "$PLUGIN_SKILLS"/*/ "$AGENTS_SKILLS"/*/ "$CLAUDE_SKILLS"/*/; do
    d="${d%/}"; name="$(basename "$d")"
    [ -f "$d/SKILL.md" ] || continue
    [ "$name" = synced ] && continue
    [ -n "${agy_seen[$name]:-}" ] && continue
    agy_seen[$name]=1
    target="$(readlink -f "$d")"
    [ "$(readlink -f "$AGY_SKILLS/$name" 2>/dev/null)" = "$target" ] && continue
    stash "$AGY_SKILLS/$name"
    run ln -s "$target" "$AGY_SKILLS/$name"
  done
  # Global rules: the same managed block as CLAUDE.md and AGENTS.md; your own rules below it stay.
  python3 "$ROOT/scripts/router.py" install "$ROOT/router/core.md" "$AGY/AGENTS.md" \
    --backup "$BACKUP" $([ "$DRY" = 1 ] && echo --dry-run)
  for f in pstack-models.md pstack-antigravity.md; do
    if ! cmp -s "$ROOT/router/antigravity/$f" "$AGY/$f"; then stash "$AGY/$f"; run cp "$ROOT/router/antigravity/$f" "$AGY/$f"; fi
  done
  # Context7 over stdio when its local server is installed. Other servers in the file stay.
  if C7="$(command -v context7-mcp)"; then
    echo "+ add context7 ($C7) to $AGY/mcp_config.json"
    [ "$DRY" = 1 ] || python3 -c '
import json, os, sys
path, cmd = sys.argv[1], sys.argv[2]
text = open(path).read() if os.path.exists(path) else ""
data = json.loads(text) if text.strip() else {}
data.setdefault("mcpServers", {}).setdefault("context7", {"command": cmd, "args": []})
with open(path, "w") as f:
    json.dump(data, f, indent=2); f.write("\n")
' "$AGY/mcp_config.json" "$C7"
  else
    echo "! context7-mcp is not on PATH; skipping Context7 for Antigravity"
  fi
  command -v agy >/dev/null || echo "  agy is not on PATH. Install it: curl -fsSL https://antigravity.google/cli/install.sh | bash"
fi

if [ "$DO_AUTOSYNC" = 1 ]; then
  CLONE="$STATE/autosync"; UNITS="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
  REMOTE="${TINDERBOX_REMOTE:-$(git -C "$ROOT" remote get-url origin)}"
  # Autosync pushes to main every 10 minutes: only to a repo you own (your fork).
  SLUG="$(sed -E 's#(\.git)?$##; s#^.*github\.com[:/]##' <<<"$REMOTE")"
  OWNER="${SLUG%%/*}"
  if command -v gh >/dev/null && ME="$(gh api user --jq .login 2>/dev/null)" && [ "${OWNER,,}" != "${ME,,}" ] && [ -z "${TINDERBOX_REMOTE:-}" ]; then
    echo "! autosync would push to $SLUG, which is not yours ($ME). Fork tinderbox, point origin at the fork," >&2
    echo "  or set TINDERBOX_REMOTE to a repo you can push to (an org fork, for example)." >&2
    exit 1
  fi
  if [ ! -d "$CLONE/.git" ]; then run git clone -q "$REMOTE" "$CLONE"; fi
  if [ "$DRY" = 1 ]; then
    echo "+ write $UNITS/tinderbox-autosync.{service,timer} (every 10 minutes)"
  else
    mkdir -p "$UNITS"
    printf '%s\n' "[Unit]" "Description=Push live agent-setup changes to tinderbox" "" \
      "[Service]" "Type=oneshot" "Environment=TINDERBOX_REMOTE=$REMOTE" "Environment=PATH=$PATH" \
      "ExecStart=$CLONE/scripts/autosync.sh" > "$UNITS/tinderbox-autosync.service"
    printf '%s\n' "[Unit]" "Description=Run tinderbox-autosync every 10 minutes" "" \
      "[Timer]" "OnBootSec=5min" "OnUnitInactiveSec=10min" "Persistent=true" "" \
      "[Install]" "WantedBy=timers.target" > "$UNITS/tinderbox-autosync.timer"
  fi
  run systemctl --user daemon-reload
  # Show what the first run would publish before turning it on.
  if [ "$DRY" = 0 ]; then
    echo "== the first sync would publish:"
    if ! TINDERBOX_REMOTE="$REMOTE" "$CLONE/scripts/autosync.sh" --dry-run; then
      echo "The preview failed, so autosync was not enabled. Fix the error above and rerun." >&2
      exit 1
    fi
    answer=n
    if [ -t 0 ]; then read -r -p "Turn on autosync to $REMOTE? [y/N] " answer; fi
    if [ "$answer" != y ] && [ "$answer" != Y ]; then
      if systemctl --user is-enabled -q tinderbox-autosync.timer 2>/dev/null; then
        echo "The timer was already enabled and stays on, now with this unit. Disable it with:"
        echo "  systemctl --user disable --now tinderbox-autosync.timer"
        exit 0
      fi
      echo "Not enabled. Add private skills to ~/.config/tinderbox/sync.ignore, then rerun,"
      echo "or run: systemctl --user enable --now tinderbox-autosync.timer"
      exit 0
    fi
  fi
  run systemctl --user enable --now tinderbox-autosync.timer
  echo "logs: journalctl --user -u tinderbox-autosync"
fi

[ -d "$BACKUP" ] && echo "backups: $BACKUP"
echo "done. Start a new agent session to load the changes."
