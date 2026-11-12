# Worked example: fl1nt.dev's Christmas palette (November 2026)

The run this skill is modelled on. Use it to calibrate depth: this is what
"high scrutiny" produced, and the owner called the result incredible.

## The ask

> "look at the colors of the entire xmas-themed site and the colors of the
> entire normal-themed site and close the gap from how polished and beautiful
> the main's theme and colors are with the xmas theme and colors. I think the
> xmas elements are really well done, but it doesn't feel as seamless and clean
> as main ... come up with something novel. high scrutiny based on the high
> quality of the main theme!"

## The brief it was given (abridged; repo specifics removed)

- **Goal:** close the polish gap between the seasonal theme and the everyday
  theme in colour and finish. PR for the owner; don't merge.
- **Setup:** repo rules first; never run against production data (a stub
  harness on its own port); routes listed; how to switch themes; desktop
  widths 1200/1440/1920.
- **Collisions:** which files other agents were changing, what to leave alone
  (the hero name, blizzard reactions), rebase before the PR.
- **The bar, described concretely:** "Everyday theme: black background ...
  lavender primary, pink secondary, cyan accent; near-black translucent panels;
  white and grey text; 2px lavender borders, 8px radius, soft lavender glow.
  It's restrained: few hues, high contrast, crisp. That's the bar."
- **What exists in the target:** its tokens, surfaces, background, decorative
  elements, the freeze state that colour-mixes the palette. What the owner
  likes and must stay recognisable.
- **Suspicions, offered as hypotheses, not conclusions:** "Brown-warm panels on
  a navy night sky, many competing hues, and uneven contrast are worth
  checking, but judge for yourself."
- **The job:** (1) audit both themes page by page in a side-by-side grid and
  write down specifically where it's less seamless; (2) design a cohesive
  system that matches the bar's restraint but is clearly the theme; be novel,
  not hex tweaks; prototype 2 or 3 directions with injected CSS, compare
  honestly, pick one; (3) implement mostly through CSS variables; (4) keep text
  contrast and visible focus in every state.
- **QA:** before/after for every page plus the special states (lights off, a
  frozen blizzard); the everyday theme unchanged; no new page errors; tests.
- **Delivery:** PR with the audit findings, the before/after grid and the
  directions tried; follow the review bot to a clean current head.

## What the agent found (the audit)

- Panels were warm brown (`rgba(20,13,7,.9)`) on a navy sky: every panel edge
  was a warm-against-cold seam.
- The everyday theme's faint primary tints on boxes and tabs turned khaki over
  the brown.
- Parchment text read as sepia.
- The page used 8 golds and 11 reds, while the pixel art itself is drawn in
  three shades each of gold, red and green, outlined in dark indigo.
- In the freeze state, boxes inside panels stayed black.

## Directions tried (on the real pages, via injected CSS)

1. **Night glass** (chosen): panels made from the sky's own navy, a shade
   darker; inner boxes lifted by a faint cool tint instead of gold.
2. **Silver frames**: clashed with the gold tabs and read as winter, not Christmas.
3. **Pine-green panels**: went murky olive.
4. **Neutral black**: looked pasted onto the sky.

## The system

- Every colour a token at the top of the theme stylesheet.
- Gold, red and green are exactly the art's three-shade ramps, each with one
  job: gold for lines, words and anything lit; the art's main red for drawn
  things (candy canes, ribbons); its lighter red for red text and badges
  (the main red made badge text hard to read); green for "on" states.
- Text is snow white and blue-grey, with the two greys set to the same
  contrast the everyday greys have on black.
- The freeze state is built from the tokens, so inner boxes ice over too.

## Evidence and numbers

- Contrast across 777 text elements: minimum 4.8 → 5.0, bottom 10% 6.8 → 7.4,
  nothing under 4.5.
- Before/after for all 8 pages plus an extra state at 1440, scrolled top to
  bottom; lights off, frozen, and three key pages at 1200 and 1920.
- Keyboard focus checked in both lighting states; the project filter buttons
  had no focus ring at all and got one.
- A palette card in the PR showing each colour, its name and its job.
- A review pass before publishing found three problems (wrong button fills,
  leftover gold washes turning brown, rust-coloured calendar lamps); all fixed
  before the PR went up.
- Pre-existing bugs it noticed but left alone were listed in the PR.

## Why it worked

- A concrete bar, described in its own terms, not "make it nicer".
- Hypotheses offered, but the agent told to judge for itself.
- Every page and state, not samples.
- Root causes named (surface hue, tint stacking, too many variants), not symptoms.
- Real directions on real pages, honestly compared, with losers explained.
- One source of truth, colour roles, derived states.
- Numbers before and after, plus a fresh-eyes review before shipping.
