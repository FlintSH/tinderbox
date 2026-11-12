# Evidence, coverage, and fidelity limits

Investigation date: **2026-09-20**. This is a versioned snapshot of the user's current website and rice, not an eternal prescription. Future changes can supersede it; re-check current sources when asked to update the brand.

## How facts were established

1. Opened the public [fl1nt.dev](https://fl1nt.dev/) site, then retrieved its production HTML/CSS and core images.
2. Located the local website at `/home/flint/Development/web`, read its `AGENTS.md`, and traced templates to the actual `style-new.min.css` + `crt.min.css` imports. Deprecated `*-legacy` templates and alternate old/Xmas styles were excluded from the primary guide.
3. Minified each relevant readable CSS source in memory with the repository's CleanCSS dependency. All four results matched the local compiled files. Downloaded production CSS matched those files byte-for-byte. Thus the readable source snapshots are evidence for the live declarations, not merely a possibly stale checkout.
4. Opened eight public routes in isolated Chromium at 1440×1100, waited for fonts, recorded computed styles, captured screenshots, and **visually inspected those screenshots**. Also inspected safe hover/focus states without submitting forms. Captures have transient live content; this is not reusable biography, telemetry, or marketing copy.
5. Inspected selected desktop configuration and source/import chains. Read active Hyprland values, resolved Rofi's configuration/theme, captured the user's actual desktop, and **visually inspected it**. Opened temporary Kitty/Rofi windows with current configuration and inspected their actual screenshots, then closed only those windows.
6. Copied exact assets and measured dimensions/frame counts with Pillow. Extracted embedded font metadata. Retained source locations and hashes in the manifest.

No personal configuration or website code was changed by the investigation. No guestbook/chat submissions or authoring actions were performed. Full desktop captures stay in the local study cache and are not in this portable package, because they contain unrelated open tabs/activity. The isolated terminal and launcher screenshots contain only the inspected surfaces.

## Read the evidence at the right level

- **Declared:** a source file says a value; the relevant source path/selector is named in the guide.
- **Computed:** Chromium or runtime configuration resolution reports the effective value. See the JSON evidence.
- **Visually observed:** a screenshot was viewed; it establishes appearance, not a universal rule or precise animation duration.
- **Configured, not rendered:** some native surfaces were inspected through settings only. These are identified in the coverage table.
- **Adaptation:** a new choice made for a deliverable; not an established rule from the user's existing work.

## Direct verification artifacts

| Artifact | What it establishes |
|---|---|
| [Manifest](evidence/manifest.json) | Original paths, snapshot paths, file SHA-256 values, asset measurements |
| [Live hashes](evidence/live-hashes.json) | Production/local equality for four CSS bundles, six core images, and Terminus WOFF2 |
| [Computed styles](evidence/computed.json) | Eight page URLs/statuses, loaded fonts, selected computed elements, image dimensions |
| [Interaction styles](evidence/interactions.json) | Actual non-submitting hover and input-focus state values |
| [Hyprland runtime](evidence/hypr-runtime.json) | Runtime borders, gaps, rounding, opacity and blur |
| [Resolved Rofi theme](evidence/rofi-resolved.rasi) | Final selector geometry/colors after the import chain |
| [Rofi font resolution](evidence/rofi-fonts.txt) | Effective configuration font and independent Fontconfig matching results |
| [Font metadata](evidence/font-metadata.json) | Font families, weights, copyright/license fields embedded in the supplied files |
| [Supplemental observations](evidence/supplemental.json) | Selected theme pointers, OpenRGB summary, shared asset hashes, source-build equality |

## Visually reviewed screenshots

These are direct captures, not generated mockups or approximations. A still frame does not establish the complete animation. Reference only the relevant screenshot for a task.

| Screenshot | Scope |
|---|---|
| [Home](screenshots/home.png) | Main identity, profile, project cards, sidebar, third-party shoutout |
| [About](screenshots/about.png) | Terminal wrapper, profile information layout, text sections |
| [Blog](screenshots/blog.png) | Code-editor hero, post cards, tab/title-bar treatment |
| [Post](screenshots/post.png) | Browser-style article wrapper and reading hierarchy |
| [Guestbook](screenshots/guestbook.png) | Forms, input fields, submit control, entry list |
| [Journal](screenshots/journal.png) | Calendar, readouts, journal feed |
| [Origins gate](screenshots/origins.png) | Entry overlay; text can be between blink frames |
| [Origins entered](screenshots/origins-entered.png) | Initial chapter/ASCII presentation after entry |
| [Hypersignal](screenshots/hypersignal.png) | Independent visualizer profile, wireframe/grid/large pixel type |
| [Actual Kitty](screenshots/kitty.png) | Current terminal font, scanlines, ANSI colors, Starship; neutral inspection sample text |
| [Actual Rofi](screenshots/rofi.png) | Actual launcher selection/search/mode geometry and text, captured directly from its layer bounds |

The full desktop was examined locally at 2560×1440, and shows the active Waybar, wallpaper margins, compositor border, and application. It is excluded from portable screenshots for the reason above. Lock/login and physical RGB hardware were not visually inspected; do not assert otherwise.

## Source map

| Source | Relevant anchors |
|---|---|
| [Core CSS](source/web/style-new.css) | `:root` line 14; base 52; typography 96; header 178; nav 266; grids 311; profile 333; sections 517; projects 534; chat 770; widgets 909; webring 1382; footer 1777; about 1860; blog 2128; article 2576; guestbook 3263; journal 5805; editor breakpoints 6297 |
| [CRT](source/web/crt.css) | `flicker`, `.crt`, `.image-container::after`, `--main-color` text-shadow declarations |
| [Home template](source/web/index.ejs) | Actual component composition and asset usage |
| [About template](source/web/about.ejs) | Terminal context and owner-authored prose |
| [Blog template](source/web/blog.ejs) | Code editor context and informal label examples |
| [Article template](source/web/post.ejs) | Browser-style wrapper |
| [Guestbook template](source/web/guestbook.ejs) | Form labels and invitation copy |
| [Journal template](source/web/journal.ejs) | Calendar, file-path title, daily data hierarchy |
| [Header](source/web/partials/header.ejs), [navigation](source/web/partials/nav.ejs), [metadata](source/web/partials/metadata.ejs), [sidebar](source/web/partials/sidebar.ejs), [footer](source/web/partials/footer.ejs) | Shared identity, assets, typography roles, casing, presence features |
| [Origins CSS](source/web/origins.css), [template](source/web/origins.ejs) | Separately scoped green/cyan narrative profile |
| [Hypersignal CSS](source/web/hypersignal.css), [template](source/web/hypersignal.ejs) | Separately scoped visualizer profile |
| [Hyprland entrypoint](source/rice/hypr/hyprland.lua), [brand](source/rice/hypr/lua/brand.lua), [settings](source/rice/hypr/lua/settings.lua), [animations](source/rice/hypr/lua/animations.lua), [environment](source/rice/hypr/lua/environment.lua), [autostart](source/rice/hypr/lua/autostart.lua) | Selected Lua config, tokens, geometry, animation, app/cursor selection |
| [Waybar config](source/rice/waybar/config), [style](source/rice/waybar/style.css), [fixed palette](source/rice/waybar/wallust/colors-waybar.css) | Active module placement and styling |
| [Kitty config](source/rice/kitty/kitty.conf), [theme](source/rice/kitty/kitty-themes/fl1nt.conf), [Starship](source/rice/starship.toml) | Font, texture, ANSI mapping, prompt grammar |
| [Rofi config](source/rice/rofi/config.rasi), [shared fonts](source/rice/rofi/0-shared-fonts.rasi), [final theme](source/rice/rofi/themes/KooL_style-4.rasi), [earlier font override](source/rice/rofi/themes/KooL_style-13-Vertical.rasi), [palette](source/rice/rofi/wallust/colors-rofi.rasi) | Import order, persistent configuration, resolved theme distinctions |
| [SwayNC](source/rice/swaync/style.css), [Hyprlock](source/rice/hypr/hyprlock.conf), [SDDM selection](source/rice/sddm/99-fl1nt.conf), [SDDM background](source/rice/sddm/theme.conf.user) | Source-level notification/lock/login evidence |
| [Btop](source/rice/btop/themes/fl1nt.theme), [Cava](source/rice/cava/config), [Quickshell](source/rice/quickshell/qml_color.json), [Wallust](source/rice/wallust/wallust.toml) | App palettes and disabled automatic recoloring |
| [GTK3](source/rice/gtk-3.0/settings.ini), [GTK4](source/rice/gtk-4.0/settings.ini), [Breeze colors](source/rice/gtk-3.0/colors.css), [Qt6ct](source/rice/qt6ct/qt6ct.conf) | Confirmed nonuniform toolkit/theme settings |

Source snapshots are reference material, not a runnable package. They may contain absolute paths and historical comments. Reuse values and assets relevant to the task; do not execute autostart or desktop commands merely because they are archived.

## Coverage and unresolved boundaries

| Surface | Verification |
|---|---|
| Main public pages, special routes | Live screenshots viewed + computed style + source/bundle comparison |
| Hyprland / wallpaper / Waybar | Actual desktop screenshot viewed, active config selection, selected runtime values |
| Kitty/Starship, Rofi | Actual temporary application screenshots viewed, source/theme/font resolution |
| SwayNC, Hyprlock, SDDM | Selected configuration/source inspected; no full rendered-state claim |
| Btop, Cava | Selected theme/config inspected; no live application screenshot claim |
| Quickshell | Color JSON and autostart inspected; consuming QML not found in config directory |
| OpenRGB | Requested profile and stored Direct-mode data inspected; physical output unverified |
| GTK/Qt, Neovim/Zed, Legcord custom CSS | Theme/font selection inspected to record exceptions; not full app audits |
| Older backups / legacy website / unused themes | Identified and excluded from current primary rules |
| Mobile, print, slide decks, documents, logo construction standards | No universal brand rules established; use explicit adaptations |

This is broad coverage of the discovered visual configuration, not a claim to have inspected every installed application's every state. No unsupported universal brand personality, target demographic, mandatory mascot, logo safe area, or medium-specific system has been invented.
