#!/usr/bin/env python3
"""The tinderbox block in global instruction files (~/.claude/CLAUDE.md, ~/.codex/AGENTS.md).

  router.py install CORE TARGET... [--backup DIR] [--dry-run]
      Put CORE's block into each TARGET and keep everything else. Replaces an
      existing block in place, or adds it at the top. Files that would change
      are copied under DIR first (DIR + the file's absolute path).
  router.py split SRC... --core C [--personal P]
      Write the block of the first existing SRC to C. With --personal, write the
      rest of that file to P (P is removed when the rest is empty).

The block runs from "<!-- tinderbox:begin" to "<!-- tinderbox:end -->". A file
with more than one begin or end marker, or an end before its begin, is refused
and left untouched, so a damaged block never eats the user's own rules.
"""
import argparse, os, shutil, sys

BEGIN, END = "<!-- tinderbox:begin", "<!-- tinderbox:end -->"


def read(path):
    with open(path, newline="") as f:
        return f.read()


def write(path, text):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", newline="") as f:
        f.write(text)


def find_block(text, path):
    """(start, end) of the one block in text, None if absent. Exits on damaged markers."""
    b, e = text.count(BEGIN), text.count(END)
    if b == 0 and e == 0:
        return None
    start, stop = text.find(BEGIN), text.find(END)
    if b != 1 or e != 1 or stop < start:
        sys.exit(f"{path}: damaged tinderbox block ({b} begin, {e} end markers); fix it by hand, nothing was changed")
    stop += len(END)
    if text[stop:stop + 2] == "\r\n":
        stop += 2
    elif text[stop:stop + 1] == "\n":
        stop += 1
    return start, stop


def install(core, targets, backup=None, dry_run=False):
    block = read(core)
    span = find_block(block, core)
    if not span or block[:span[0]].strip() or block[span[1]:].strip():
        sys.exit(f"{core}: must contain exactly one tinderbox block and nothing else")
    plans = []
    for target in targets:  # check every target before changing any
        text = read(target) if os.path.exists(target) else ""
        span = find_block(text, target)
        if span:
            new = text[:span[0]] + block + text[span[1]:]
        else:
            new = block + ("\n" + text if text.strip() else "")
        plans.append((target, text, new))
    for target, text, new in plans:
        verb = "unchanged" if new == text else "update" if text else "create"
        print(f"{verb} {target}")
        if dry_run or new == text:
            continue
        if backup and text:
            dest = os.path.join(backup, os.path.abspath(target).lstrip("/"))
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy2(target, dest)
            print(f"  backup {dest}")
        write(target, new)


def split(sources, core, personal=None):
    src = next((s for s in sources if os.path.exists(s)), None)
    if not src:
        return
    text = read(src)
    span = find_block(text, src)
    if not span:
        print(f"warning: no tinderbox block in {src}; {core} left as is")
        return
    write(core, text[span[0]:span[1]])
    if personal:
        rest = (text[:span[0]] + text[span[1]:]).strip()
        if rest:
            write(personal, rest + "\n")
        elif os.path.exists(personal):
            os.remove(personal)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("install")
    i.add_argument("core"); i.add_argument("targets", nargs="+")
    i.add_argument("--backup"); i.add_argument("--dry-run", action="store_true")
    s = sub.add_parser("split")
    s.add_argument("sources", nargs="+"); s.add_argument("--core", required=True); s.add_argument("--personal")
    a = p.parse_args()
    if a.cmd == "install":
        install(a.core, a.targets, a.backup, a.dry_run)
    else:
        split(a.sources, a.core, a.personal)
