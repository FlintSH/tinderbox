// Facts the panels show, read from the repo so they never drift from what ships.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

const frontmatter = (file) => {
  const m = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  let key = null;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) { key = kv[1]; out[key] = kv[2].replace(/^(>-?|\|-?)$/, "").replace(/^["']|["']$/g, ""); }
    else if (key && /^\s/.test(line)) out[key] = (out[key] + " " + line.trim()).trim();
  }
  return out;
};

const skillsIn = (dir) => existsSync(dir)
  ? readdirSync(dir).filter((n) => existsSync(join(dir, n, "SKILL.md"))).sort()
      .map((name) => ({ name, description: frontmatter(join(dir, name, "SKILL.md")).description || "" }))
  : [];

// pstack's skill list at the pinned commit, from the clone build-pstack-codex.sh
// keeps. Without one (a machine that never built pstack for Codex), fetch just
// that commit's tree into the same place.
function pstackSkills(pin) {
  const src = join(homedir(), ".local/share/tinderbox/sources/cursor-plugins");
  const git = (...args) => execFileSync("git", ["-C", src, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const list = () => git("ls-tree", "--name-only", pin, "pstack/skills/").trim().split("\n")
    .map((p) => p.replace("pstack/skills/", "")).filter(Boolean);
  try { return list(); } catch {}
  try {
    if (!existsSync(join(src, ".git"))) execFileSync("git", ["clone", "-q", "--filter=blob:none", "--no-checkout", "https://github.com/cursor/plugins.git", src]);
    git("fetch", "-q", "--filter=blob:none", "origin", pin);
    return list();
  } catch {
    throw new Error(`pstack ${pin.slice(0, 7)} could not be read or fetched into ${src}.`);
  }
}

// Counts only what scripts/install.sh --all installs: your skills, the router
// plugin, pinned git skills (not the manual Remotion/Playwright steps) and pstack.
export function repoData(root) {
  const own = skillsIn(join(root, "skills"));
  const router = skillsIn(join(root, "plugins/tinderbox/skills"));
  const sources = JSON.parse(readFileSync(join(root, "upstream/sources.json"), "utf8"));
  const pinned = sources.skills.filter((s) => s.source.startsWith("https://")).map((s) => ({
    name: s.name, source: s.source, pin: s.pin, license: s.license,
    skills: s.skills.map((k) => (typeof k === "string" ? k : k.name)),
  }));
  const manual = sources.skills.filter((s) => !s.source.startsWith("https://")).map((s) => s.name);
  const ps = sources.plugins.find((p) => p.name === "pstack");
  const pstack = { version: ps.version, pin: ps.pin, skills: pstackSkills(ps.pin) };
  const pinnedCount = pinned.reduce((n, s) => n + s.skills.length, 0);
  return {
    own, router, pinned, pstack, manual,
    counts: {
      own: own.length, router: router.length, pinned: pinnedCount, pstack: pstack.skills.length,
      total: own.length + router.length + pinnedCount + pstack.skills.length,
    },
  };
}

// readme/copy.md: one "## key" heading per piece of copy, the text below it.
// A value of TODO renders as a visible placeholder.
export function readCopy(file) {
  const copy = {};
  let key = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const h = line.match(/^## (\S+)\s*$/);
    if (h) { key = h[1]; copy[key] = ""; continue; }
    if (key && !line.startsWith("<!--")) copy[key] += line + "\n";
  }
  for (const k of Object.keys(copy)) copy[k] = copy[k].trim();
  return copy;
}
