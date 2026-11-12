# Audit checklist

Work through this against the sheets and metrics. Each finding you write down
should name the place (route/state/viewport, element), what's wrong, why it
breaks the bar, and the root cause (a token, a component, a one-off literal).

## Contents
1. Colour system
2. Surfaces and depth
3. Text and contrast
4. Typography
5. Spacing, alignment, rhythm
6. Borders, radii, shadows, glows
7. Components and states
8. Iconography and imagery
9. Themes, modes and customisation
10. Motion
11. Responsive (only if in scope)

## 1. Colour system
- How many hues are doing work? The bar usually uses few. Count families in
  the palette audit; more than ~3 accent hues is a smell.
- Near-duplicates: several slightly different golds/greys/reds that were meant
  to be one value (palette `nearDuplicates`). Each becomes one token.
- Roles: can you say what each colour means? (primary = interactive/lit,
  destructive = danger, success = on...). A colour with two jobs, or a job done
  by two colours, is a finding.
- Temperature: warm surfaces on a cool background (or the reverse) make seams
  at every edge.
- Saturation balance: neon accents next to muted surfaces; a destructive red
  louder than the primary.
- Tint stacking: translucent overlays compounding into muddy or khaki tones
  (a gold 5% tint over brown becomes khaki).
- Hardcoded literals outside the token files (palette `outsideTokens`), Tailwind
  palette classes next to semantic tokens, mixed neutral families
  (slate + zinc + gray).

## 2. Surfaces and depth
- Elevation ladder: background, panel, inset, overlay, popover. Is each step
  distinguishable and consistent? Do inner boxes have a defined level?
- Do surfaces sit on the background (same hue family, slightly lifted) or look
  pasted on?
- Glass/blur effects: legible content behind, consistent opacity.
- Separation strategy: borders, shadows or fill steps. Mixing all three
  arbitrarily reads as unfinished.

## 3. Text and contrast
- Contrast audit: anything under AA (4.5, 3 for large text) unless decorative
  or disabled. For light-on-dark, check APCA too (body text under about Lc 60
  reads weak even when WCAG 2 passes).
- Hierarchy: primary/secondary/muted text levels. Are they consistent, and is
  muted still legible? Matching the bar's contrast steps is often the fix.
- Coloured text: links, badges, status text, text on accent fills (the classic
  failure: dark text on mid-tone buttons, white on yellow).
- Placeholder text, timestamps, helper text, table headers, disabled states.

## 4. Typography
- Scale: how many sizes are in use? Do they follow steps or drift (13, 13.5,
  14px)?
- Weights, letter-spacing and case used consistently for the same role.
- Line height and measure for body text; tight or loose spots.
- Font loading: fallback flashes, missing glyphs, faux bold.

## 5. Spacing, alignment, rhythm
- Paddings for the same component type are equal; gaps follow a scale.
- Edges align across sections; baselines in rows of cards.
- Optical issues: icons not centred with text, uneven button padding.

## 6. Borders, radii, shadows, glows
- One radius family (and nested radii = outer minus padding).
- Border widths and colours per role; 1px hairlines vanishing on some
  backgrounds.
- Shadows/glows the same direction, softness and colour family; glow colour
  matching the theme.

## 7. Components and states
- Buttons: every variant (primary, secondary, ghost, destructive, link) in
  default, hover, active, focus, disabled, loading.
- Inputs: default, hover, focus, error, disabled, filled, placeholder.
- Focus: visible on every interactive element (focus sheet), consistent style,
  3:1 change contrast. Missing rings are common on custom buttons and tabs.
- Menus, dialogs, popovers, toasts, tooltips: surface level, border, shadow,
  backdrop, close affordance.
- Tables and lists: header contrast, zebra/hover rows, dividers.
- Empty, loading (skeletons), error and permission-denied states: designed or
  default-looking?
- Selection colour (`::selection`), scrollbars, the caret.

## 8. Iconography and imagery
- Stroke weights and sizes consistent; icon colour follows text colour roles.
- Illustrations, avatars, logos: do they share the palette? Bright assets
  against a muted UI, or the reverse.
- Image placeholders and broken images.

## 9. Themes, modes and customisation
- Light and dark both deliberate, not one derived lazily from the other.
- User/admin-customisable colours (accent pickers, presets, custom tokens):
  test the defaults, every preset, and extremes (very light, very dark, highly
  saturated). Text-on-accent and focus rings must adapt (computed, not fixed).
- Seasonal or alternate themes: everything still recognisable; the bar's
  restraint kept.

## 10. Motion
- Transitions on colour/background feel consistent in duration and easing.
- Reduced motion respected.

## 11. Responsive (only if in scope)
- Same system on narrow screens; nothing truncated or overlapping; tap targets.
