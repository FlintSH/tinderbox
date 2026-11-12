# Foundations

Sources: [core CSS](source/web/style-new.css), [live computed styles](evidence/computed.json), [Hyprland brand tokens](source/rice/hypr/lua/brand.lua), [Waybar](source/rice/waybar/style.css), [Kitty](source/rice/kitty/kitty.conf), and [Starship](source/rice/starship.toml). Verification method is in [evidence](evidence.md).

## Identity and hierarchy

The public document title and metadata say `fl1nt.dev`; the header image uses `logo.png`, whose visible lettering is the stylized `FlintSH` handle. The home name switcher alternates the handle and given name under bracketed username/IRL labels. These are distinct uses, not interchangeable spellings. The logo is an existing raster asset, not live Handjet text.

The shared visual relationships are directly observable on the home/about/blog/journal pages and desktop: mostly black ground; bright violet perimeter lines; black/translucent black content containers; white and gray text; a compact monospace reading texture; selectively colored status information; pixel imagery. This description is not evidence for a historical art movement, target audience, brand archetype, or marketing positioning.

## Exact core palette

These are actual CSS properties in `style-new.css :root`. Hyprland's `brand.lua` explicitly says to keep its tokens synchronized with that palette.

| Property | Exact value | Confirmed applications |
|---|---|---|
| `--primary` | `#867cff` | Outlines, links, heading color, selected navigation, terminal cursor, active compositor border |
| `--primary-dim` | `#6b63cc` | Inactive compositor/split border, terminal selection, prompt brackets, gradient end |
| `--primary-bright` | `#a499ff` | Brighter links/button hover, SwayNC border via color12, high-contrast primary |
| `--secondary` | `#ff69b4` | Featured/project role badge, featured border, contributor treatment, owner chat, Git branch, streak number |
| `--accent` | `#00ffff` | Company badge, inline code, mood-only calendar cells, terminal success prompt character, Python readout |
| `--success` | `#00ff41` | Online/playing indicator, nonnegative mood, Node readout |
| `--warning` | `#ffaa00` | Idle state, Git changes, Rust readout, caps lock |
| `--error` | `#ff4444` | Offline/negative mood/danger, terminal failed command, recording state |
| `--bg-primary` | `#000000` | Canvas, terminals, input interiors |
| `--bg-secondary` | `rgba(0, 0, 0, 0.85)` | Standard web panels/header, Waybar center island, Rofi imported background |
| `--bg-tertiary` | `rgba(0, 0, 0, 0.95)` | Denser overlays, inactive browser/editor tabs, calendar tooltip |
| `--bg-overlay` | `rgba(134, 124, 255, 0.1)` | Project interiors, stats, subtle hover surfaces |
| `--text-primary` | `#ffffff` | Primary reading text |
| `--text-secondary` | `#cfcfcf` | Descriptions, secondary readouts |
| `--text-dim` | `#999999` | Small labels, metadata, timestamps, placeholders |

`--border-color: var(--primary)`. The rice has application-specific extra tones enumerated in [rice](rice.md), not extra global tokens. `#7970e5` is a native palette/visualizer interpolation; `#0a0a0a` is an ANSI/tab/meter black. Do not replace core black with these everywhere.

Hyprland serializes translucent colors as `rgba(000000d9)`, `rgba(000000f2)`, `rgba(867cff1a)`: alpha 217/255, 242/255, 26/255. These approximate the CSS decimal alphas rather than being literally identical numbers.

Color role is contextual. A cyan company badge does not establish a universal rule for organizations. A green online status does not make every positive action a green button: the site's primary buttons are violet with black text.

## Typography

| Role | Family | Size / weight / behavior |
|---|---|---|
| Default body | `"Terminus (TTF)", "Space Mono", monospace` | 14px, 400, line-height 1.5 |
| Ordinary paragraph | Inherits body | 1.6 line-height; bottom margin 16px |
| Hero description | Mono | 16px, line-height 1.6, secondary gray |
| Header tagline | Mono | 16px |
| Generic h1 | `"Handjet", sans-serif` | 2.5rem, 800 |
| Generic h2 | Handjet | 1.8rem, 700 |
| Generic h3 | Handjet | 1.4rem, 600 |
| Generic h4 | Handjet | 1.2rem, 600 |
| Home `.hero-title` | Handjet | 2.2rem (35.2px observed), 800, line-height 1.4 |
| `.section-title` | **Mono override** | 1.4rem (22.4px), typically h2/700 |
| `.widget-title` | **Mono override** | .9rem (14.4px), typically h3/600, uppercase |
| Project card h3 | Handjet | 1.1rem (17.6px), 600, white, line-height 1.2 |
| Project description | Mono | 12px, line-height 1.4, secondary gray |
| Stat number | Handjet | 1.5rem, 700, primary |
| Status value | Mono | 14px, 700 |
| Header/status label | Mono | 11px, uppercase, 1px tracking |
| Nav | Mono | 14px, lowercase |
| Final `.badge` rule | Mono | **8px, 700, .8px tracking**, uppercase |
| Journal feed title | Handjet | 1.45rem (23.2px), 600, line-height 1.15, white |
| Journal hero stat | Handjet | 1.25rem, 800 |

The root computed font size is **16px**, although body is 14px. Do not multiply rem values by 14. Headings generally declare 1px letter-spacing. Small labels commonly use .5px or 1px; journal feed dates use 1.5px. These are per-component facts, not one global tracking value.

Terminus is the first loaded web family, with local WOFF2/WOFF at normal weight/style. Google imports request Handjet 400/600/700/800 and Space Mono 400/700. Browser evidence records loaded families. Bundled desktop font assets also include Terminus bold/italic and Space Mono italic; availability does not prove every variant is used on the website.

Body declares `image-rendering: pixelated` and `-webkit-font-smoothing: none`. Keep pixel graphics crisp and use the actual fonts. Smoothing is browser-dependent, not proof of identical rasterization on every OS. Kitty uses Terminus 15pt; Waybar 14px. Do not interchange units.

## Geometry and spacing

Exact spacing: `xs=4px`, `sm=8px`, `md=16px`, `lg=24px`, `xl=32px`, `xxl=48px`.

Exact shape tokens: border width 2px, primary radius 8px, small radius 4px.

- Web section/profile/widget outer shell: 2px solid primary, 8px radius.
- Project and stat interiors: 1px violet at 30% alpha; 8px and 4px radius respectively.
- Many internal separators: 1px violet at 10–30% alpha.
- Small controls/inputs: usually 4px radius; final tiny badges use **10px**, so rounded capsule labels do exist.
- Terminal/editor/browser wrapper: 2px primary, 8px radius, overflow clipped.
- Compositor: 1px border, 10px rounding, gaps 6px in / 12px out. Do not overwrite native geometry with web geometry.

The site is panel-dense, with a primary content column and narrow widget column. Its top bar has identity and status areas followed by a separate nav row. This is a confirmed composition, not a requirement to add a sidebar to every branded artifact.

## Light, texture, and gradients

| Surface | Declared shadow |
|---|---|
| Profile card | `0 0 20px rgba(134,124,255,.2)` |
| Section card | `0 0 15px rgba(134,124,255,.15)` |
| Widget | `0 0 10px rgba(134,124,255,.1)` |
| Terminal/editor/browser | `0 0 25px rgba(134,124,255,.3)` |
| Project hover | `0 4px 20px rgba(134,124,255,.3)` |
| Featured project | `0 0 20px rgba(255,105,180,.15)` |
| Main logo | `filter: drop-shadow(0 0 8px var(--primary))` |
| Home avatar | `filter: drop-shadow(0 0 12px var(--primary))` |

Gradients are selective: hero name 45° violet-to-pink text; editor/browser title bars 135° primary-to-dim; journal hero bar 180° violet alpha .16-to-.04. Btop/Cava have measured graph ramps. No evidence supports an arbitrary page-wide pastel mesh gradient.

Body uses original `blue-bg.gif`, `center top / cover no-repeat`, over black. It contains blue/cyan block-like pixels on predominantly black ground. Site and desktop use this asset family. Refer to hashes in the asset evidence instead of inventing replacement colors from a screenshot frame.

CRT texture is detailed in [motion](motion.md). Computed heading/link text shadows can be `none` because a later CRT rule references unresolved `--main-color`. The brand visibly uses glowing borders/assets and declares text glows; it is inaccurate to claim every heading visibly has a 2px halo.

## Confirmed high-contrast declaration

`@media (prefers-contrast: high)` changes primary to `#a499ff` and secondary background to black at 95%; white text remains white. No complete light-mode system was found. New accessibility behavior should retain the aesthetic and be identified as adaptation rather than invented history.
