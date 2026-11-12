# Desktop and terminal applications

This inventory follows the active Hyprland Lua entrypoint, selected Waybar symlinks, Rofi's resolved theme, and application theme references. Backups and available-but-unselected themes are not the current design. Sources are bundled under [source/rice](source/rice/hypr/hyprland.lua); runtime and screenshot evidence are indexed in [evidence](evidence.md).

## Compositor and wallpaper

Hyprland reported `configProvider: lua`. The entrypoint loads `lua/settings.lua` and `lua/animations.lua`; settings import `lua/brand.lua`, whose comment explicitly ties it to website `:root` colors. Runtime `getoption` confirmed:

| Property | Value |
|---|---|
| Active/inactive border | `#867cff` / `#6b63cc`, solid |
| Border width | 1px |
| Inner/outer gaps | 6px / 12px on all sides |
| Rounding | 10px |
| Active/inactive opacity | 1.0 / .95 |
| Blur size/passes | 6 / 2 |

Additional configured values: fullscreen opacity 1; inactive dim enabled at .1; special-workspace dim .8; shadow range 3/render power 1 with primary active and primary-dim inactive; blur ignores opacity, includes special windows/popups. Group active border is primary-bright; groupbar active background is black. These are compositor-specific semantics, not CSS shadow parameters.

Saved wallpaper state selects `/home/flint/Pictures/wallpapers/blue-bg.gif`. Autostart restores it through the wallpaper script, with the same path as fallback. Actual desktop screenshots show sparse blue pixels over black around the application windows. The 2560×1440, scale-1 display had 51px reserved at the top; its hardware dimensions/refresh are environment facts, not brand constraints.

Environment declares Bibata-Modern-Ice cursor, size 24. GTK configs instead name capitaine-cursors; report this layer difference rather than claiming one cursor is universal. QT_QPA_PLATFORMTHEME is qt6ct. Compositor animation profile is specified in [motion](motion.md).

## Waybar

Selected config symlink: `configs/[TOP] fl1nt Desktop`. Selected stylesheet symlink: `style/[Extra] Modern-Combined - Transparent.css`. The filename's ancestry does not determine the palette: the active CSS explicitly defines fl1nt tokens.

- Top, exclusive, fixed center, spacing 3; margins 3px top, 8px left/right.
- Global font stack: Terminus (TTF), Space Mono, JetBrainsMono Nerd Font, monospace; 14px, weight 400.
- Bar itself transparent, 6px radius, 4px left/right padding. Left/right groups transparent; right group has 12px extra right padding.
- **Center island:** black/.85, 2px primary outline, 8px radius, 25px primary/.3 glow, padding 8px vertical/10px horizontal, zero vertical margin.
- **Left:** logo, player information, active window label. Logo uses actual 280×60px wordmark with contain/no-repeat/center, min-width 100px, min-height 30px, 2px padding, 4px horizontal margin, no rounded background.
- **Center:** notification group, workspace buttons, clock, idle inhibitor, hint, small separators.
- **Right:** tray, recording, update count, network speed, power profile, motherboard readouts, audio/status groups.
- Workspace buttons: `0 3px` padding, `3px 2px` margin, 4px radius, violet/.2 background, .4 opacity inactive. Active opacity 1.0, minimum width 30px. Hover .8 opacity and 15px primary/.4 glow.
- Tooltips: black, 2px violet outline, 8px radius, white mono, 15px primary/.4 glow.
- Updates stay flat with adjacent modules. Pending is bright primary; hover padding expands from `0 6px` to `0 14px`, white text, violet/.1 background, 6px primary text glow, .25s ease. Zero-update state collapses its size.
- Clock is white/600; notification icon primary; muted audio error; idle enabled success. Power performance/error, balanced/primary, saver/success. Recording uses error and a 1s opacity pulse; uploading/stopping have local `#44ff44`/`#ffaa44` exceptions.

The CSS imports a Latte file and a file under `wallust`, but explicit fl1nt variables drive the major visuals. Critical-temperature rules still refer to imported `@red`, and some other one-off colors remain. Do not claim the stylesheet contains only core palette values.

## Kitty and shell

Active Kitty includes `kitty-themes/fl1nt.conf`. Configuration explicitly calls this a terminal matching the site's CRT aesthetic. The inspected actual terminal shows thin crisp glyphs, violet/pink/cyan readouts, and fine horizontal scanlines. Its sample text was generated only to inspect styling; the sample words are not canonical brand copy.

| Setting | Value |
|---|---|
| Regular | Terminus (TTF), Medium |
| Bold / italic / bold italic | Corresponding Terminus styles |
| Size | 15pt; config notes its native 20px size |
| Icon fallback | Explicit Nerd Font Unicode symbol ranges only |
| Background | black, opacity .9, dynamic opacity allowed |
| Texture | 1×2px tiled PNG, alternating RGB (13,11,22) and (0,0,0), background tint .55 |
| Padding | 6 |
| Cursor | primary purple block, black cursor text, blink interval .75s, never stops blinking, trail 1 |
| URL | bright primary |
| Selection | white on primary-dim |
| Active tab | black on primary |
| Inactive tab | dim gray on `#0a0a0a` |
| Tab style | Powerline, slanted; title ` {index} {title} ` |
| Split border | primary active, primary-dim inactive; bell warning |

Exact ANSI mapping, a terminal palette rather than a replacement for web semantic tokens:

| Slot | Normal | Bright |
|---|---|---|
| Black 0/8 | `#0a0a0a` | `#4d4d4d` |
| Red 1/9 | `#ff4444` | `#ff7070` |
| Green 2/10 | `#00ff41` | `#66ff8c` |
| Yellow 3/11 | `#ffaa00` | `#ffc44d` |
| Blue 4/12 | `#867cff` | `#a499ff` |
| Magenta 5/13 | `#ff69b4` | `#ff8cc6` |
| Cyan 6/14 | `#00e5e5` | `#00ffff` |
| White 7/15 | `#cfcfcf` | `#ffffff` |

Fish initializes Starship. [Starship source](source/rice/starship.toml) explicitly maps website section prefixes, bracket labels, header time, and caret to the prompt. The first line begins dim-violet `//`, followed by bold-violet directory and optional compact bracketed Git/language readouts; the clock `%T` is right-aligned by a fill. Second line uses `❯` cyan on success, red on failure; vim command mode `❮` pink. Git branch pink, changes warning, Node green, Rust warning, Python cyan, Docker dim violet. Duration appears after 3 seconds in dim gray. Brackets are primary-dim. Blank line before prompt is enabled.

Fish syntax colors use named ANSI slots in its frozen theme, inheriting terminal colors. Do not claim all shell syntax is independently hardcoded to website CSS.

## Rofi

`config.rasi` has many repeated `@theme` statements. The last is `KooL_style-4.rasi`; `rofi -dump-theme` confirmed its resolved structure. Do not choose `saint-rofi.rasi` just because it exists.

The shared font file **declares** `Terminus (TTF) Medium 15` for configuration and Medium 13 for element text, but **the resolved configuration reports `Fira Code SemiBold 12`**. The earlier imported `KooL_style-13-Vertical.rasi` declares that font; configuration survives later theme changes. The final dumped theme has no element-specific font declaration. Actual launcher capture shows heavier/smoother text than Kitty. Thus the initial shared font file is not proof of effective Terminus use. Fontconfig matching and the resolved config are retained in the evidence.

Confirmed theme geometry: centered window, width 35%, outer border 0, outer radius 10px; mainbox padding 20px/spacing 10px. Search inputbar uses dim-violet color1, `8px 12px` padding, 8px radius. Vertical mode buttons sit beside a one-column, six-line results list. List: 2px primary border, 8px radius, 10px padding, 5px spacing. Elements: 10px padding, 8px radius, icon plus text. Selected normal background resolves to color12 **bright primary**, with black/.85 foreground reference. The screenshot confirms a bright-violet selected row, dim-violet search/mode area, violet outline, black result body.

Although the color file lives under `wallust`, its header states that it is hardcoded. Imported color11 is primary; color12 bright primary; color1 dim primary. Global theme rules override some imported semantic definitions. Preserve effective values rather than reading only the imported file.

## Notifications

[SwayNC](source/rice/swaync/style.css) imports the fixed Waybar palette. Border maps to color12 (`#a499ff`); background black/.8; text white. Notifications use 2px border, 10px radius, `3px 10px 3px 6px` padding. Control center uses 1px border and 10px radius. Typeface is **JetBrains Mono Nerd Font, bold, 1rem**, not Terminus. Close/DND controls retain `#f7768e`; some switch borders use `#7aa2f7`. These are real inherited exceptions, not additions to the brand's primary token set. Notification settings were inspected; a full live notification/control-center screenshot is not claimed.

## Lock and login

Hypridle invokes ordinary `hyprlock`; it does not select the `hyprlock-1080p.conf` alternative. Current lock config repeats brand tokens, uses static `blue-bg.png`, blur size 2/passes 2, noise .01, contrast 1.1, brightness .8, vibrancy .15. Centered stack: date 20, time 96, seconds 32 violet, user 24 white; Terminus/Space Mono/JetBrainsMono fallback.

Input: 400×60, 3px primary outline, black/.5 interior, white text, warning caps lock, 8px rounding. Hint 14px primary; lower status 14px dim. These are source measurements; the session was not locked to verify the rendered screen.

SDDM selects `cachyos-simplyblack` and `fl1nt-bg.png`, cursor Bibata-Modern-Ice. This establishes the chosen background/theme, not a fully bespoke fl1nt login component system. Login rendering was not viewed.

## Monitoring, audio, auxiliary theme data

Btop selects `themes/fl1nt.theme`, with background enabled and truecolor. Black background, white text/title, primary keyboard highlights, white-on-dim-primary selection, dim-primary box outlines, `#4d4d4d` inactive/dividers, `#0a0a0a` meter background. Its ramps:

- Temperature: success → warning → error.
- CPU/process: dim primary → primary → cyan.
- Free/used/download: dim primary → primary → bright primary.
- Cached: `#00b8b8` → `#00e5e5` → cyan.
- Available/upload: `#cc5490` → pink → `#ff8cc6`.

Cava enables eight-stop gradient: `#6b63cc`, `#7970e5`, `#867cff`, `#a499ff`, `#c98ce0`, `#ff69b4`, `#7bb4d9`, `#00ffff`. The file says Wallust no longer manages it. These ramps are evidence for these specific visualizations, not a universal categorical chart palette.

Quickshell has a brand-valued `qml_color.json`: black window, primary/dim/near-black layers, white/secondary text, primary/cyan accents, dim-primary selection. Autostart invokes `qs`, but no shell QML implementation was found in that config directory; token availability is verified, consumption/rendering is not.

OpenRGB autostart requests profile `fl1nt`. Its saved profile contains Direct-mode controllers and packed color integer `16743558` (`0xff7c86`). The profile was read, but physical LEDs and runtime byte interpretation were not measured. Do not claim a verified emitted RGB/hex color from the integer alone.

## Deliberate scope distinctions

Wallust's template outputs are commented out with an explicit note that the fl1nt palette is hardcoded. Do not regenerate brand colors from a different wallpaper.

The whole environment is not exclusively custom branded. Inspected GTK settings use Breeze/Adwaita-dark, Noto Sans, breeze-dark icons and imported Breeze colors. Qt6ct selects Catppuccin-Mocha with Flat-Remix-Blue-Dark icons. Neovim selects Catppuccin; Zed selects system mode with Ayu Dark/One Light. Legcord's custom quick CSS file is empty; generated Vencord styles are not a personal brand specification. These coexist with the shared compositor frame. Presence in the rice does not make Noto Sans, Catppuccin, or Discord's native styling the fl1nt identity font/palette.
