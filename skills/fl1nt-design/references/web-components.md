# Web component specifications

All selectors below refer to [verified core CSS](source/web/style-new.css), with [templates](source/web/index.ejs), [computed styles](evidence/computed.json), and [screenshots](evidence.md) as corroboration. Values are current implementation facts, not a mandate to reproduce the whole website in other products.

## Page frame

The ordinary site has a 1200px body minimum width and horizontal overflow. Its main grids have `max-width:1400px`, centered margins, padding `32px 24px`, gap 24px, columns `1fr 300px`, and `align-items:start`. Main sections stack independently from the sidebar, so short sections do not stretch to match a tall adjacent widget column.

At the inspected 1440px viewport, the content grid is 1400px wide including 48px horizontal padding. The inner columns are therefore 1028px and 300px, separated by 24px. This is a measured/computable instance, not a universal percentage split.

The standard header is black at .85 with 10px backdrop blur, padding `24px 24px 16px`. Its grid uses `1fr auto`, 32px gap, max-width 1400px, and a 1px violet/.2 bottom line. Identity items have 24px gap. The main logo declares 64px height and automatic width; preserve the asset's 280:60 aspect ratio, including transparent pixels.

The header status grid has four equal columns with 24px gaps. Labels are centered 11px uppercase gray, 1px tracking, 4px bottom margin. Values are 14px bold mono with 2px current-color glow. Status uses green/amber/red; time, temperature, and mood are actual readouts, not decorative filler. Do not copy the captured `00:00:00`, counts, weather, or mood as permanent content.

Navigation is a separate black/.85 row with 20px blur, 2px primary bottom border, `16px 24px 24px` padding, max-width 1400px. Internal and external groups each use 24px gaps. Links use `8px 16px` padding and 4px radius. Active: primary fill, black text. Hover: violet/.1 background, -1px vertical move. External links append a 10px `↗`, opacity .7, left gap 2px.

## Surface hierarchy

| Component | Fill | Border/radius | Padding | Shadow |
|---|---|---|---|---|
| `.profile-card` | black/.85 | 2px primary / 8px | 32px | 20px primary/.2 |
| `.section-card` | black/.85 | 2px primary / 8px | 32px | 15px primary/.15 |
| `.widget` | black/.85 | 2px primary / 8px | 24px | 10px primary/.1 |
| `.project-card` | primary/.1 | 1px primary/.3 / 8px | 16px | Added on hover |
| `.stat-item` | primary/.1 | 1px primary/.3 / 4px | 8px | None in its own rule |
| `.music-tracker` | black | 1px primary/.3 / 4px | 16px | None in its own rule |

Shadows above have zero offsets unless otherwise specified. Sections also have a 16px bottom margin; stack wrappers have 24px gaps, so apparent separation can exceed the gap token. Avoid blindly converting screenshots into one uniform gap.

## Home profile and projects

Profile uses `auto 1fr`, 32px gap. The visual stack centers avatar and badges with 16px gap. Avatar: 120×120px, 2px primary border, 8px radius, 8px padding, `object-fit:cover`, 12px primary drop shadow. The original avatar is 82×82px, despite metadata advertising 400×400. Use the actual file.

Profile badge fills are violet/location, pink/role, cyan/company with black text. **Final cascade:** all `.badge` elements receive 8px type, `3px 6px` padding, 10px radius, .8px tracking, weight 700. An earlier rule declares 11px/4×8/4px; it is overridden. The live profile badges confirm the final small capsule appearance.

Hero name: Handjet 2.2rem, inline gradient primary-to-secondary at 45°. Labels sit above the name in mono 9px uppercase, 1px tracking. The intro has 8px gaps. Description is 16px gray at 1.6 line-height. Three stats form equal columns, gap 16px, centered readouts with Handjet 1.5rem values and 11px uppercase labels.

Projects: `repeat(auto-fit,minmax(280px,1fr))`, 24px gaps. Cards are flex columns with minimum height 200px. Header aligns title and tiny badges; body text flexes so footer stays bottom-aligned. Footer has 8px top padding and a 1px primary/.1 top separator. Metadata/links are 11px. Card links use `4px 10px` padding, 4px radius, violet/.1 fill and violet/.3 border; hover inverts to black on solid primary.

Featured cards use a pink border and 20px pink/.15 glow. Owner badge: violet/.2 fill, 1px violet border, violet text. Contributor badge: pink/.2 fill, pink outline/text. Featured badge: solid pink/black text. Ordinary card hover lifts 2px, changes border to primary/.5 and adds `0 4px 20px primary/.3`.

Project filters are a horizontal compact group, gap 4px. Each is 10px mono/600 uppercase, .5px tracking, `4px 8px`, 4px radius, 1px violet outline, black/.7 interior. Active is primary/black with 12px primary/.6 glow. This is substantially smaller than a normal action button.

## Buttons and inputs

The source has several button families, not one fully normalized design system.

| Family | Type / padding | Normal | Hover |
|---|---|---|---|
| Chat send | 12px bold uppercase / 16px 24px | primary fill, black text, borderless | bright primary, 12px primary/.4 glow |
| Guestbook submit | 14px bold / 8px 24px | primary fill, black text, 1px primary, 4px radius | bright primary, -1px, 15px primary/.4 glow |
| Show more | 13px uppercase / 8px 24px | transparent, primary text/1px outline, 8px radius | primary/black, -2px, `0 4px 20px primary/.3` |
| Copy button | 10px/600 uppercase / 4px 8px | primary/black, 1px primary, 4px radius | **dim** primary (exception), -1px, 8px primary/.4 |
| Journal default | 13px bold lowercase / 8px 16px | primary/.1, white text, 1px primary, 4px radius | primary/.25, -1px, 10px primary/.4 |
| Journal primary | Same | solid primary/black | bright primary/black |
| Journal ghost | Same | transparent, primary/.4 border, secondary text | Inherits family hover |
| Journal danger | Same | error/.08, error border/text | error/.2, 10px error/.4 |
| Journal small | 11px / 5px 10px | Same family | Same family |

Guestbook inputs: black, white mono 14px, 1px primary/.3 outline, 4px radius, `8px 16px`. Placeholder dim gray at .7 opacity. Focus becomes solid primary border with 8px primary/.3 glow. Field labels: 12px secondary gray uppercase, .5px tracking, 4px gap from input. Form rows: two equal columns, 16px gap; form stack also 16px. Optional labels retain normal case. Chat input is an alternate borderless interior with a shared container border and dividing top line.

For a new control without a historical equivalent, use the closest relevant family and identify any additional state treatment as an implementation choice. Do not invent a new mandatory brand focus ring or disability-opacity scale and attribute it to the original.

## Terminal, editor, and browser metaphors

About uses a terminal wrapper with a solid violet header, black header text, `8px 16px` header padding and 24px body padding. Title is `about_flint.sh`; prompt is green `fl1nt@dev:~$`; command is white `whoami --verbose`. The body contains real profile information in aligned label/value rows. Labels have minimum width 100px. The avatar in this context is 100×100px with 4px padding and a 15px glow.

Blog hero uses a code-editor wrapper. Header: 135° primary-to-dim gradient; title is a file path; tiny File/Edit/View labels; tabs; line numbers; syntax-colored sample code. Inactive tabs are decorative, with an explicitly casual tooltip in the source. Do not make decorative affordances silently look functional in a new product.

Post content uses a browser-window wrapper with title, controls, tabs, and URL-like context. Both wrappers have 2px primary border, 8px radius, 25px primary/.3 glow. Tabs use 12px mono, `8px 16px`, black/.95 background, dim text, 1px primary/.2 right separator. Active: black, white text, 2px violet bottom line.

Window dots are actual exceptions to semantic colors: terminal/editor use red `#ff5f57`, yellow `#ffbd2e`, green `#28ca42`, 12px circles, 4px gaps, .8 opacity. Journal uses 11px dots, 6px gaps, red `#ff5f56`, green `#27c93f`. Do not silently replace them with core status colors during exact reproduction.

Article browser content has 48px padding. Its main page title is Handjet **2.5rem**, line-height 1.2, with a working 4px primary glow from the more specific `.post-layout .page-title` selector; this is visible in the screenshot despite generic heading glow being canceled elsewhere. The reading body is **16px mono at 1.8 line-height**. Optional excerpt is 1.1rem, italic secondary gray.

Headings inside the article content use Handjet; h1/h2/h3/h4 are 2/1.6/1.3/1.1rem. H2/H3 prepend dim mono `##`/`###`. Blockquote: 4px primary left border, secondary background, 24px padding, 32px vertical margin, italic secondary text. Inline code: cyan, black/.85 fill, `2px 6px`, 4px radius, 1px primary/.2 outline. Pre blocks: 2px primary, 8px radius, 24px padding, horizontal scroll, 14px code.

## Sidebar, presence, and community widgets

Widget stack has 24px gaps. Titles are uppercase mono .9rem with 1px tracking and commonly start `//`. Music tracker has 64px album art, 4px radius; status dot 8px; status label 10px; name/artist 12px. Long song text can scroll. The public content varies; song titles/art are not brand assets.

The site includes recent posts, commits, counters, live chat, a guestbook, music, and shareable web buttons. These are real features that establish the observed composition and tone. They are not obligatory widgets on every new fl1nt-branded project.

IRC chat uses mono 13px, inline `<name>` with dim delimiters, violet username, white message, and right-aligned 11px dim timestamp at .7 opacity. Message gap is 3px; container is black with 1px primary and 8px radius; message viewport height 300px. Owner messages use pink; system messages use red. Chat is line-oriented rather than individual rounded chat bubbles.

Webring graphics are 88×31px, 4px gaps, 4px violet/.5 drop shadow. Hover scales 1.05 and increases glow to 8px primary. The share button uses the actual `mybutton.gif`; neighboring site buttons remain other people's identities, not fl1nt logo alternatives.

Settings are 12px labels and 14px checkboxes with primary accent; rows gap 8px. Footer is black/.85, 10px backdrop blur, 1px violet/.3 top line, 24px vertical padding, 48px top margin, centered 14px mono text at 1.8 line-height. Small sprites and concealed links exist; they are page-specific flourishes.

## Journal/data treatment

Journal hero keeps the same outer shell with 22px primary/.22 glow. Header uses the faint vertical violet-alpha gradient, a file-path title `~/journal.log`, compact time-range controls, and traffic-light dots. Stats have 12px mono labels with 1.25rem Handjet numbers; streak is pink, nonnegative mood green, negative mood red.

Activity calendar: cells 13px, gap 3px, seven rows, 2px radius. Its exact ramp is:

| Level | Fill | Border |
|---|---|---|
| 0 | primary/.07 | primary/.12 |
| 1 | primary/.30 | primary/.30 |
| 2 | primary/.55 | primary/.45 |
| 3 | `rgba(178,118,222,.80)` | `rgba(190,120,210,.6)` |
| 4 | pink | pink; 6px pink/.5 glow |
| Mood only | cyan/.26 | cyan/.4 |

Calendar hover scales 1.3 in .1s and glows 9px primary/.7 (cyan/.6 for mood-only). Empty slots are transparent, unlogged author links may have dashed borders. Tooltip: black/.95, 1px primary, 4px radius, `8px 11px`, 11px mono, 16px primary/.4 glow.

Feed items are 240px-high horizontal flex panels with `16px 24px` padding, 24px gap, violet/.1 fill, 1px violet/.3 border, 8px radius. Hover lifts 2px, border .6, shadow `0 8px 28px primary/.28`. Title is Handjet 1.45rem; dates 10px uppercase cyan; stat keys 9px uppercase dim and values 11px bold. Scope these rules under the journal feed: unscoped `.post-title` and `.post-link` would collide with blog cards.

## Viewport behavior and exceptions

Standard public pages retain their desktop grid and 1200px minimum width. The CSS explicitly limits journal mobile responsiveness to the authoring page: <=1100px removes that minimum, <=760px stacks editor fields/nav and makes toolbar buttons 44×44px, <=420px collapses status to one column. Blog authoring later shares additional mobile treatment. These are actual context-specific rules, not a general mobile brand specification.

For a new responsive product, retain typography/color/surface relationships while creating the required layout. Describe that layout as a new adaptation. Do not obstruct mobile use solely to imitate a desktop-only implementation.

The home shoutout uses another project's red/orange graphics and treatment. `/origins` and `/hypersignal` have separate stylesheets and fonts; see [motion and alternate experiences](motion.md). None supersedes the standard profile by default.
