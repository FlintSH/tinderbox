// The task-flow diagram as SVG, one file per GitHub theme. The embedded font
// is Terminus, monospace with a 0.5em advance, so layout is plain arithmetic.
// Narrow on purpose: GitHub scales images down to ~358px on a phone.
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Fills are opaque so either file still reads if a viewer shows the other theme's canvas.
const THEMES = {
  // fl1nt.dev tokens on GitHub's dark canvas.
  dark: { text: "#ffffff", dim: "#a8a8b8", head: "#a499ff", dot: "#867cff", spine: "#6b63cc", sep: "#2b2752",
    own: "#ff69b4", up: "#00e5e5", ps: "#a499ff", fill: "#14122a", hubFill: "#262150", hubLine: "#867cff" },
  // fl1nt.dev has no light theme; same hues, darkened for contrast on white.
  light: { text: "#1f2328", dim: "#59636e", head: "#4a41c4", dot: "#5b52d6", spine: "#8b84e6", sep: "#dcd9f7",
    own: "#c2185b", up: "#00796b", ps: "#4a41c4", fill: "#f7f6ff", hubFill: "#e6e3fc", hubLine: "#5b52d6" },
};

const W = 480, PAD = 16, X0 = 44, FS = 16, ADV = FS / 2, PILL_H = 32, PILL_PX = 11, GAP = 8, INDENT = 30;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const pillW = (s) => s.length * ADV + PILL_PX * 2;

// Pills left to right from `start`, wrapping at the right edge.
function wrap(nodes, start) {
  const rows = [];
  let x = start, row = [];
  for (const n of nodes) {
    const w = pillW(n.name);
    if (row.length && x + w > W - PAD) { rows.push(row); row = []; x = start; }
    row.push({ ...n, x, w }); x += w + GAP;
  }
  if (row.length) rows.push(row);
  return rows;
}

export const flowAlt = (layers) => "How a task flows through tinderbox, in four layers. " + layers.map((L, i) =>
  `${i + 1}, ${L.name}: ${L.hub ? `${L.hub.name}, which hands off to ` : ""}${L.nodes.map((n) => n.name).join(", ")}.`).join(" ");

export function flowSvg(root, layers, theme) {
  const t = THEMES[theme];
  const font = readFileSync(join(root, "skills/fl1nt-design/assets/fonts/terminusttf-4.49.3-webfont.woff2")).toString("base64");
  const color = (k) => (k === "own" ? t.own : k === "up" ? t.up : t.ps);
  const pill = (n, y, hub = false) =>
    `<rect x="${n.x}" y="${y}" width="${n.w}" height="${PILL_H}" rx="4" fill="${hub ? t.hubFill : t.fill}" stroke="${hub ? t.hubLine : color(n.kind)}" stroke-width="${hub ? 2 : 1.25}"/>`
    + `<text x="${n.x + PILL_PX}" y="${y + 21}" font-size="${FS}" fill="${hub ? t.text : color(n.kind)}">${esc(n.name)}</text>`;

  const out = [], dots = [];
  let y = PAD;
  for (const [i, L] of layers.entries()) {
    // Heading above the pills: "1  always loaded".
    dots.push(y + 9);
    out.push(`<text x="${X0}" y="${y + 15}" font-size="14" fill="${t.dim}">${i + 1}</text>`
      + `<text x="${X0 + 20}" y="${y + 15}" font-size="20" fill="${t.head}">${esc(L.name)}</text>`);
    y += 30;
    if (L.hub) {
      const hub = { ...L.hub, x: X0, w: pillW(L.hub.name) };
      out.push(pill(hub, y, true));
      const branchX = X0 + 14, top = y + PILL_H;
      y += PILL_H + 10;
      for (const row of wrap(L.nodes, X0 + INDENT)) {
        out.push(`<path d="M${branchX} ${top} V${y + PILL_H / 2} H${X0 + INDENT - 2}" fill="none" stroke="${t.spine}" stroke-width="1.5"/>`);
        for (const n of row) out.push(pill(n, y));
        y += PILL_H + GAP;
      }
    } else {
      for (const row of wrap(L.nodes, X0)) { for (const n of row) out.push(pill(n, y)); y += PILL_H + GAP; }
    }
    y += 14;
    if (i < layers.length - 1) { out.push(`<line x1="${X0}" y1="${y - 7}" x2="${W - PAD}" y2="${y - 7}" stroke="${t.sep}" stroke-width="1"/>`); y += 10; }
  }

  // Spine with a dot per layer, arrowhead at the end.
  const end = y - 6;
  const spine = `<line x1="20" y1="${dots[0]}" x2="20" y2="${end}" stroke="${t.spine}" stroke-width="2"/>`
    + `<path d="M14 ${end - 7} L20 ${end + 1} L26 ${end - 7}" fill="none" stroke="${t.spine}" stroke-width="2"/>`
    + dots.map((d) => `<circle cx="20" cy="${d}" r="5" fill="${t.dot}"/>`).join("");

  // Legend.
  y += 8;
  let lx = X0;
  const legend = [["mine", t.own], ["pinned third-party", t.up], ["pstack", t.ps]].map(([label, c]) => {
    const s = `<rect x="${lx}" y="${y - 12}" width="13" height="13" rx="2" fill="${t.fill}" stroke="${c}" stroke-width="1.5"/>`
      + `<text x="${lx + 19}" y="${y}" font-size="${FS}" fill="${t.dim}">${label}</text>`;
    lx += 19 + label.length * ADV + 20;
    return s;
  }).join("");
  const H = y + PAD;

  // Family name is neutral on purpose: the OFL reserves "Terminus (TTF)" for the original files.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<title>${esc(flowAlt(layers))}</title>
<style>@font-face{font-family:"tbx-mono";src:url(data:font/woff2;base64,${font}) format("woff2")}text{font-family:"tbx-mono",ui-monospace,"SFMono-Regular",Menlo,monospace}</style>
${spine}
${out.join("\n")}
${legend}
</svg>
`;
}
