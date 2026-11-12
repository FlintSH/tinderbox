# PR body template

Write it in the repo owner's voice and follow their rules (attribution,
em dashes, tone). Specific beats impressive. Lead with what changed and why.

```markdown
<One or two sentences: what was polished and the bar it was held to.>

**What was off** (the audit)
- <Root cause 1, specific: "Panels were warm brown on a navy sky, so every
  panel edge was a warm-against-cold seam.">
- <Root cause 2 ...>
- <Measured: "The UI used 8 golds and 11 reds; the art uses 3 of each.">

**What I chose: <name of the system>**
- <Surfaces ...>
- <Text levels ...>
- <Accent roles: each colour and its one job ...>
- <Where it lives: "every colour is a variable at the top of X; states derive
  from them".>

![Palette card](<url>)

**Directions tried**
- <Chosen>: <why it won>.
- <Other>: <why it lost, one line>.
- <Other>: <why it lost>.

![Directions on the same page](<url>)

**Before / after**
<Every page and state in scope, before above after (or side by side). Group by
state. Include the special states and the hardest pages.>

**Checks**
- Contrast across <N> text elements: minimum <a> → <b>, bottom 10% <c> → <d>,
  below AA <e> → <f>. <APCA body median if relevant.>
- Keyboard focus visible on every stop in <states> (<n> stops checked).
- <Unchanged areas confirmed: "the everyday theme loads none of this".>
- <Tests / build / visual tests per repo policy.>
- Review: <rounds> rounds of independent review; last round found <nothing
  above low / the following lows, left as is: ...>.

**Not changed / known limits**
- <Anything out of scope, anything left for later, honest caveats.>

**Pre-existing issues noticed** (not fixed here)
- <Bugs you saw but didn't touch, with where.>
```

Host images the way the repo already does (an assets branch, the PR's own
attachments, CI artifacts). Never paste local paths; check every image URL
loads before you finish.
