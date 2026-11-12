# Original assets and font resources

Use paths relative to the skill folder. [Manifest](evidence/manifest.json) records original locations, dimensions, frame counts, and SHA-256 values. [Live comparisons](evidence/live-hashes.json) confirms the primary web images and Terminus WOFF2 are byte-identical to the public site at capture time. Do not reconstruct the wordmark or portrait with generated imagery when these originals are available.

## Identity graphics

| File | Actual dimensions | Role / exact observations |
|---|---|---|
| [logo.png](../assets/images/logo.png) | 280×60, RGBA | Main wordmark. Slanted segmented pixel lettering, cyan/blue upper strokes through violet lower strokes, transparent ground. The desktop wordmark is byte-identical. |
| [avatarv3-og.png](../assets/images/avatarv3-og.png) | **82×82**, RGB | Pixel portrait: brown-haired bearded figure with dark glasses, warm plaid clothing, blue outdoor background. Used by home/about and social metadata. Preserve the provided identity; do not invent traits or reinterpret it as a new mascot. |
| [mybutton.gif](../assets/images/mybutton.gif) | 88×31; **one frame** | Shareable personal-web button, warm multicolor lettering with dark outline. File extension does not make it animated. It differs visibly from the header wordmark and is intended for the 88×31 context. |
| [favicon.ico](../assets/images/favicon.ico) | Largest inspected frame 48×48 | Existing site favicon; reuse rather than replacing with a newly designed initial. |

The main logo's CSS height is 64px on the website; Waybar places the same source inside a min-100×30 contain area. These are observed placements, not logo minimum-size/exclusion-zone rules. The avatar's metadata says 400×400, but the real file is 82×82. Do not report it as a high-resolution 400px original.

## Backgrounds and texture

| File | Measurements | Use |
|---|---|---|
| [blue-bg.gif](../assets/images/blue-bg.gif) | 640×400; 40 frames; inspected frame delay 60ms | Site's pixel background; active desktop wallpaper copy matches byte-for-byte. Original artwork is the specification. |
| [blue-bg.png](../assets/images/blue-bg.png) | See manifest | Static local wallpaper used by Hyprlock. Use the actual image rather than assuming which GIF frame produced it. |
| [blue-bg-2560.png](../assets/images/blue-bg-2560.png) | See manifest | Existing large static desktop-family asset. Presence alone does not mean this is the active wallpaper. |
| [terminal-scanlines.png](../assets/images/terminal-scanlines.png) | 1×2 tile | Opaque rows `(13,11,22)` and `(0,0,0)`; Kitty tiles with tint .55. |

Web background positioning is `center top / cover no-repeat`. Do not tile the whole 640×400 GIF simply because it is low-resolution: the source uses cover. Preserve aspect ratio for identity graphics and avoid smoothing away intentional pixel edges. Static media cannot reproduce motion; using an existing static counterpart is a medium adaptation, not proof that animation is absent from the brand.

## Contextual assets

[enderman.gif](../assets/images/enderman.gif) is 188×200 with 12 frames and an inspected delay of 150ms. It is an existing game-character site flourish, not the primary brand mascot. Source footer styling displays it at 160×160; that particular distortion is a site measurement, not a blanket rule for illustrations. Include it only in an appropriate context.

The [cursor images](../assets/images/cursors/Normal.png) preserve the site's pointer artwork. All available PNG roles are included under `assets/images/cursors/`: Normal, Link_Select, Text_Select, Busy, Waiting_In_Background, Move, Precision_Select, Unavailable, Help_Select, Alternate_Select, resize variants, Handwriting, Location_Select, Person_Select. The client maps these to remote cursor states. This is not evidence that the operating system uses those same assets; desktop cursor configuration is separately documented.

Other people's webring buttons, album art, project logos, and the RE-TAPED promotional artwork are contextual content. They are intentionally not presented as reusable fl1nt identity assets. Sounds and hidden-experience content are not necessary to reproduce the standard visual language.

## Fonts

Included under `assets/fonts/`:

- `terminusttf-4.49.3-webfont.woff2` and `.woff`: exact local web faces, regular.
- `TerminusTTF-4.49.3.ttf`, `TerminusTTF-Bold-4.49.3.ttf`, `TerminusTTF-Italic-4.49.3.ttf`, `TerminusTTF-Bold-Italic-4.49.3.ttf`: installed desktop family files.
- `Handjet-Variable.ttf`: installed Handjet variable font. The web uses Google-served Handjet; family is confirmed, byte equivalence to that served subset is not asserted.
- `SpaceMono-Regular.ttf`, `SpaceMono-Bold.ttf`, `SpaceMono-Italic.ttf`, `SpaceMono-BoldItalic.ttf`: installed fallback family. The web Google import requests 400 and 700.

License texts travel with the files: [OFL-Terminus.txt](../assets/fonts/OFL-Terminus.txt) (Reserved Font Names "Terminus Font" and "Terminus (TTF)"), [OFL-SpaceMono.txt](../assets/fonts/OFL-SpaceMono.txt) and [OFL-Handjet.txt](../assets/fonts/OFL-Handjet.txt), all SIL OFL 1.1 as published by each project. Keep them next to the fonts when copying them elsewhere.

Read the [font metadata](evidence/font-metadata.json) for embedded naming/license information. These files are copied for the user's branding task; brand ownership does not relicense third-party fonts. No new license claim is made for artwork or fonts. For public redistribution preserve applicable original notices and verify terms if the deliverable requires it.

When porting, register font families explicitly and check the resulting renderer. A successful font-file copy is not proof the application uses it. The Rofi discrepancy is a concrete example. A local `@font-face` mapping is a packaging adaptation; keep the confirmed family/weight roles. Do not silently replace Handjet with a conventional sans face or replace Terminus with a generic coding font.

## Exact token exports

[tokens.css](../assets/tokens.css) is the original 29-property `:root` block, without added components or global resets. [tokens.json](../assets/tokens.json) preserves the same strings and aliases. They supply semantic color, fonts, border geometry, spacing, and transition tokens. They do not load fonts, set body background, implement CRT, or provide a complete page stylesheet. Add only the component rules needed for the task, using the references as evidence.
