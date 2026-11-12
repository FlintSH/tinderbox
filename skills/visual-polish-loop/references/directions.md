# Prototyping directions

The point of directions is to find the best system, not to justify the first
idea. A direction is a coherent answer to the audit's root causes, not a
different hex code for the same answer.

## Make them genuinely different

Vary the strategy along one or two of these axes per direction:

- **Surface strategy:** surfaces tinted from the background's own hue, neutral
  surfaces, lighter elevated surfaces, glass.
- **Accent strategy:** one accent doing all interactive work; a pair (primary
  plus a supporting hue); accents only for semantics (status) with a neutral
  interactive colour.
- **Separation:** borders, shadows/glows, or fill steps.
- **Temperature and saturation:** warm vs cool neutrals; vivid vs restrained accents.
- **Contrast model:** match the bar's contrast steps exactly; or a wider
  ladder with a dimmer muted level.
- **Source of colour:** derived from brand art/logo/illustration ramps (often
  the most cohesive), from the existing tokens, or from a reference.

Directions that differ only in accent hue, or only in lightness, are one
direction.

## Prototype without touching source

Write each as a stylesheet that overrides tokens (and only the few component
rules that must change) in `.agent-artifacts/visual-polish/directions/<name>.css`.
Capture with `--css`:

```sh
node <skill>/scripts/capture.mjs --tag dir-night --css .agent-artifacts/visual-polish/directions/night.css
node <skill>/scripts/contrast-audit.mjs --tag dir-night --css .agent-artifacts/visual-polish/directions/night.css
node <skill>/scripts/sheet.mjs compare --tags before,dir-night,dir-moon,dir-pine
```

Capture each on the hardest pages and states, not just the hero: dense tables,
forms with errors, dialogs, the special states (lights off, frozen, empty).

## Choose honestly

- Judge against the bar and the product's identity first, novelty second.
- Use the numbers (contrast, palette count) as guard rails, not as the decision.
- If two are close, ask an independent reviewer to compare them blind (labels
  A/B/C, no rationale) against the bar.
- Write down why each loser lost, in one line each. These go in the PR; they
  show the choice was earned, and they stop the owner asking "did you try X?".

## Worked example

For fl1nt.dev's Christmas theme (see worked-example.md) the four directions
were night glass (panels from the sky's own navy), silver frames, pine-green
panels and neutral black. Night glass won because the surfaces finally sat in
the sky; silver read as winter rather than Christmas and clashed with the gold
tabs, pine went murky olive, and neutral black looked pasted on.
