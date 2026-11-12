# Reviewer briefs

Independent reviewers find what the author can't see. Give them the bar and
the evidence, never your conclusions or a summary of what you changed (that
anchors them). Split sheets so each reviewer covers a disjoint set; 3–4
reviewers per round is plenty, fewer for small UIs.

## Finish reviewer (after-state only)

```
You are reviewing the visual finish of <product> (<one line on what it is>).
The quality bar: <describe the bar concretely: its palette, surfaces, contrast,
type, borders, the feeling. Attach or point to reference images.>
Product identity to keep: <compact, dense, playful, etc.>

Look at these sheets (full size, one at a time): <paths>
They show <routes/states/viewports>. Some are 2x crops of components.

Find everything that falls short of the bar. For each issue give:
- where: sheet path + the region (e.g. "top right, the Save button")
- what: the concrete problem ("the muted label text is barely readable on
  the card fill", "three different greys for dividers in one table")
- why it breaks the bar (one line)
- severity: high (illegible, broken, clearly off-system), medium (noticeable
  inconsistency or rough edge), low (nitpick or taste)

Rules: report problems only, no praise. Don't guess about code. Don't report
something as a problem just because it differs from what you'd design if it
matches the bar. If a sheet is clean, say "clean". At most 15 issues, ranked by
severity. Look at small things: 1px borders, focus rings, icon alignment,
placeholder text, disabled states, empty states, dividers, badges.
```

## Regression reviewer (before/after pairs)

```
These sheets show the same pages before (top/left) and after (bottom/right) a
visual polish pass on <product>: <paths>.
Find anything that got worse: lower legibility, lost information, broken
layout, a state that used to be distinct and isn't, colours that now clash,
anything that looks unintended. Also note anything in "after" that still looks
unfinished. Same format and severity scale as above. Don't comment on
improvements.
```

## Direction judge (blind)

```
Here are <N> versions of the same pages, labelled A, B, C: <paths>.
The bar: <description>. Product identity: <description>.
Rank them by how well they meet the bar while staying recognisably <product>.
For each, give the strongest point and the most serious weakness, with the
sheet region. Then say which you'd ship and what it still needs.
```

## Using the results

- Verify each finding against the evidence before acting; reviewers misread
  crops sometimes. Note rejected findings and why in loop-log.md.
- Group findings by root cause; fix causes (a token, a component) rather than
  each symptom.
- A finding two reviewers report independently is almost certainly real.

## Without subagents

If your harness can't spawn reviewers, do the review as a separate pass after
a break in context: re-read only the bar and this brief, look at the sheets
fresh, and write findings before reading your own notes. Say in the PR that the
review was single-agent.
