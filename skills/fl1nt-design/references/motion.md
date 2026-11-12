# Motion, rendering, and alternate experiences

Sources: [core CSS](source/web/style-new.css), [CRT CSS](source/web/crt.css), [desktop animation declarations](source/rice/hypr/lua/animations.lua), [Kitty](source/rice/kitty/kitty.conf), [Hypersignal](source/web/hypersignal.css), [Origins](source/web/origins.css). Screenshot evidence records appearances at a moment in time; exact durations below come from source, not timing guesses made from still images.

## Standard interface timings

| Treatment | Exact declaration |
|---|---|
| General transition token | `all .3s ease` |
| Fast transition token | `all .15s ease` |
| Project/filter/card links | commonly `all .2s ease` |
| Navigation hover | -1px Y, violet/.1 surface, fast transition |
| Project hover | -2px Y, outline/glow intensify, .2s |
| Header typing | 3s, `steps(40,end)`, width 0→100% |
| Header caret | 3px violet right border, .75s `step-end infinite`, transparent except midpoint violet |
| Name enters | .5s `cubic-bezier(.25,.46,.45,.94)`, opacity 0→1, Y 3→0px |
| Name label | .4s same curve; active opacity .6, Y 0 |
| `.hero-title .highlight` | 3s ease-in-out hue rotation 0→60→0 degrees; applies only when this class exists |
| Overflow song text | 15s linear infinite, X 100%→-100% |
| Webring button track | 20s linear infinite, X 0→-100% |
| Calendar cell hover | .1s transform/shadow, scale 1.3 |
| Journal admin dot | 2s ease-in-out, opacity 1→.4→1 |
| Waybar recording | 1s ease-in-out, opacity 1→.3→1 |
| Kitty block cursor | .75s blink interval, continuous |

Live pages were observed with animated blue pixel wallpaper and changing readouts. Do not freeze the sampled music/status/time values into new work. Retain the source's small local hover movements rather than adding large elastic card motion as a supposed brand rule.

## Important cascade distinctions

Core CSS declares `@keyframes pulse` more than once. The last definition, around line 4513, is **scale 1→1.05→1**, replacing earlier opacity pulses with the same name. Consequently an element referencing `pulse` uses this final animation, even if its earlier nearby comment suggests opacity. Separate `pulse-dot` remains its own opacity animation.

`.name` elements and `.hero-title .highlight` have different declarations. A gradient name does not automatically inherit the separate hue-rotation class. Do not assign every colorful text element a rainbow cycle.

`float` and `glitch` keyframes exist, but a keyframe definition alone does not establish that every sprite or heading uses it. Inspect the matching element and animation property. The ordinary footer sprite has explicit 160×160 dimensions but no blanket float declaration in its own rule.

## CRT rendering

The public templates place `.crt` on both body and an inner wrapper. `.crt` has `position:relative`, `overflow:auto`, and `flicker .3s infinite`. The flicker keyframes are very narrow: .995, .998, .993, .997, .995 opacity at 0/25/50/75/100%. It is not a strong black-frame strobe.

`.crt::after` is a fixed pointer-events-none radial vignette: transparent through 50%, black/.1 at 80%, black/.2 at 100%; overall opacity .7, z-index 2. Nested matching `.crt` wrappers can each contribute this effect. The snapshot may therefore appear dimmer than raw token swatches.

Working image-container scanline overlay: transparent to 50%, black/.1 at 70%, black/.2 at end of each row; tile size `100% .3rem`; animation 1s `steps(3)` translates Y .3rem→0. It is attached to `.image-container::after` and is noninteractive. The rule `.crt img::after` is also declared, but pseudo-elements on replaced images should not be assumed to render; the wrapper overlay is visible evidence on the avatar.

The file includes `.output` green flicker and `.glow` green radial rules. Ordinary templates use `crt-glow`, not `.glow`, and do not instantiate `.output`. These unused green treatments do not turn the standard site into a green CRT theme.

Text glow has a real source/render discrepancy. The core stylesheet declares 2px violet heading glow, 4px link-hover glow, and stronger dedicated glow-link effects. Later CRT heading/link rules use `var(--main-color)`, which is undefined on the normal inspected pages. Sampled general heading shadows were `none`; basic paragraphs/spans can still have .5px current-color glow. The more specific article `.post-layout .page-title` retains a working 4px primary glow, visibly present in the post screenshot. `--main-color` is set by special client-side effects. For exact reproduction preserve these distinctions; do not assert all text glows are either working or absent.

Terminal CRT is a separate implementation: the actual 1×2 pixel texture, tiled with .55 tint and .9 terminal opacity. Reuse that asset for terminal fidelity instead of copying web image overlays.

## Motion accessibility and scope

The current web button track explicitly repeats the same animation under both `prefers-reduced-motion` values. The skill records this behavior; it does not require recreating it in new products. Honor the task's accessibility needs and identify altered motion as an adaptation. No universal reduced-motion scheme is established by the source.

Do not add sound to an unrelated branded deliverable because the source site contains chat/game sounds. Sound belongs to actual features and explicit experiences; brand styling alone does not require it.

## Hyprland motion

Values are Hyprland animation parameters, **not milliseconds**:

| Leaf | Speed | Curve | Style |
|---|---|---|---|
| windows | 4 | wind | slide |
| windowsIn | 4 | winIn | slide |
| windowsOut | 2 | smoothOut | slide |
| windowsMove | 4 | wind | slide |
| border | 1 | liner | default |
| borderangle | 100 | liner | loop |
| fade | 2 | smoothOut | default |
| workspaces | 3 | overshot | default |
| workspacesIn | 3 | winIn | slide |
| workspacesOut | 3 | winOut | slide |

Bezier control points: wind/overshot (.05,.9),(.1,1.05); winIn (.1,1.1),(.1,1.1); winOut (.3,-.3),(0,1); liner (1,1),(1,1); smoothOut (.5,0),(.99,.99); smoothIn (.5,-.5),(.68,1.5). The source notes borderangle is visually inert with solid border colors. Do not add rotating rainbow borders to imitate this unused effect.

## Separately scoped experiences

### Origins

This route loads only its own CSS and uses Share Tech Mono, then Terminus/Courier New fallback. It is a chapter-based personal narrative with an audio entry prompt, ASCII heading, bracket controls, green/cyan details, dark panels and fine scanlines. It is not the default fl1nt palette.

Exact local tokens: black `#0a0a0a`, dark `#111111`, panel `#161616`, border `#2a2a2a`, green `#00ff41`, green-dim `#00aa2a`, green glow rgba(0,255,65,.3), cyan `#00e5ff`, cyan-dim `#007a8a`, cyan glow rgba(0,229,255,.15), red `#ff1744`, yellow `#ffd600`, white `#c0c0c0`, gray `#555555`. Body 14px/1.7. Scanline pattern transparent 0–2px, black/.15 2–4px. Its screenshot initially captures the entry gate; interior evidence is identified separately when captured.

### Hypersignal

The live route visually renders a full-screen wireframe visualizer, grid floor, large pixel title, layered noise/scanlines and bracketed controls. Its palette is independent: black `#03000a`, pink `#ff2bd6`, cyan `#00f7ff`, green `#39ff14`, yellow `#fff200`, orange `#ff7a00`, blue `#5b4dff`, white `#f8f7ff`. Fonts: Press Start 2P for pixel display, Share Tech Mono for text, Courier New fallbacks. Body uses crosshair cursor, hidden overflow, no text selection, and audio-reactive CSS variables in radial gradients.

Noise overlay opacity .14, .35s stepped animation; scanline overlay has white/.08 0–1px and transparent 1–5px; the route contains separate secret/memory layers. These prove a specific expressive variant exists. Do not scatter its neon green, wireframes, grid floor, pixel title font, hidden interactions, or narrative claims across ordinary branded interfaces without a relevant request. Its music and special fonts are not bundled as part of the standard reusable asset pack.
