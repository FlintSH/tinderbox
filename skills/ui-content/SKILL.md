---
name: ui-content
description: Decide what goes on a screen, in what order, and in which words. Use automatically whenever you create UI (landing pages, docs sites, app screens, forms, dialogs, navigation) and whenever you are asked to clean up, tighten or rewrite the content of existing UI. Run it before building and again on the rendered result. It catches metadata and preamble ahead of the thing the page is for, labels and helper text that restate the obvious, slogan headings, pages where nothing leads, repeated content, and mock-ups standing in for the real product. Not for visual design.
---

# UI content

Decide what goes on a screen, in what order, and in which words.

Agents usually get the look of a UI right and the content wrong. The page is
well styled, and the first thing on it is a build number. The feature grid sits
under four paragraphs. Every card has a label saying what the card plainly is,
and the heading is a slogan. Each piece seemed reasonable when it was added.
Nobody decided what the page is for, so nothing leads it, and it reads as
generated.

Colour, type, spacing and motion craft belong to the design skills. Checking
the result in a browser belongs to visual QA.

## When it applies

- **New UI, always.** Every screen, page, section, dialog or component you
  create, and any content you add to an existing screen.
- **Existing UI, only when asked.** A request to clean up, tighten, rewrite or
  polish a screen puts its content in scope. Otherwise, if you are changing one
  part of a screen and see these problems in the rest of it, leave the rest
  alone. Shipped content can be there for reasons you can't see, and trimming
  it unasked turns a small change into a redesign. One line in your report
  saying what you noticed is enough. Don't write an audit nobody asked for.
- **Project rules win.** If the repository requires something on the page
  (provenance, attribution, legal text, complete documentation), it stays.
  Read what the rule actually requires. It usually fixes that the thing
  exists, not where it sits or how it is worded.

## How to use it

**Before building**, write a content plan in your task notes. A few lines for
a page, one line for a small component:

1. Who lands here, and what they came to do.
2. The one thing the screen exists for.
3. Everything else you intend to put on it, in the order the reader needs it,
   each with the reason they need it here. Something with no reason goes to
   another page or goes away.

Build from that plan. Layout comes second. Lay out first and the grid decides
the content: six cards because six fit.

**After building**, render the screen at desktop and mobile width and read
every string on it from the top, including the small ones: chips, captions,
counters, helper lines. Read the render, not the source. Shared layouts and
components add text that never appears in the file you edited, which is how a
version row ends up above every title on a site. Put each string through one
test:

> Does this tell the reader something they need here that they don't already
> know from what is next to it?

"Need here" depends on who the reader is and what the page is for, so the same
sentence can pass on a reference page and fail on a landing page. These
questions are the same test, aimed at where it usually fails. Each has a
section below.

- What is the first thing on the page, and is it what the reader came for?
- Which element is the main one?
- Does anything appear twice?
- Which labels, eyebrows, subtitles, helper lines, counters and chips could
  go without anyone noticing?
- Would any heading fit unchanged on another product's site?
- Is any sentence spent explaining the page instead of the product?
- Is everything here for this page's reader, or for someone further along?
- Is the product shown real?

Fix, render again, read again.

**In the final report** for a cleanup, list what you cut, what you moved and
where it went, and what you renamed. Content should never disappear silently.

The examples below come from one real product: a self-hosted file host, called
Stow here, with a landing page, a docs site and a web app. They show the
judgment. They are not a list of banned strings, and the test applies the same
way to things they don't cover: buttons, placeholders, errors, empty states.

## Lead with what the page is for

The reader came for one thing. Whatever sits above it claims to matter more.

**Bookkeeping.** Every docs page started like this:

```
Docs for Stow v3.1.0 · Development preview · a02537a7 · Build details · Versions & changes

Uploading files
```

The reader came to learn how to upload. Which commit built the page matters to
almost nobody, and to them only when something looks wrong. Title first. The
version goes in the version switcher and the footer, where someone looking for
it will look.

**Preamble.** The Features page, before:

```
A home for your files. Built around you.

Stow brings uploads, previews, organization, and automation to your own
server and domain. Start with the essentials; add the tools and settings
that fit your workflow.

Filter the capabilities below, or take a guided tour. Each card leads to a
complete guide with instructions and important limits.

You can also open the handbook from Documentation in the Settings header,
or choose Setup guide during first-run setup. Both open a new tab so your
current form stays in place [...] Setup links for versions before 2.1.0
open the archive homepage with the original setup guidance.

Reading for a particular installation? Browse dated documentation releases
and compare changes. [...]

Find a capability   [ search ]
33 of 33 capabilities
[ the feature grid ]
```

After:

```
Features

Everything Stow does. Pick one to see how it works.

[ search ]  [ filters ]
[ the feature grid ]
```

The page exists for the grid, and the grid was below the fold. The slogan
became the page's name. The second paragraph narrated controls the reader can
see. The third (where a Documentation link sits in the app's settings, how
setup links behave on old versions) is no use to someone already reading the
docs, so it moved to the setup guide. The fourth pointed at the Versions page,
which is in the navigation.

**Caveats before the first step.** The upload guide opened with one paragraph
covering the permission uploading needs, when role changes take effect, what
happens to an upload in flight when its API token is revoked, and what changes
without the sharing permission. All true. None of it helps someone who has not
tried to upload yet. Start with how to upload. The permission belongs in a
short "If Upload is missing" section, and the token behaviour on the API tokens
page.

**History.** "Earlier builds didn't show a speed and placed the card in the
top left" sat in the middle of instructions. The reader has the current
version. How it used to work goes in the changelog.

## One thing leads

Hierarchy is a content decision before it is a visual one. Decide which
element is the main one and let the rest be plainly secondary. If you can't
name the main thing, the reader can't find it.

You can tell nobody decided when everything weighs the same: rows of identical
cards, every section built as heading plus paragraph plus button, groups of
three and six because the grid had room. The landing page was a headline, a
six-tab demo and six equal cards. Nothing on it said "this is the product".

Equal weight is right when the items really are peers and the page is an index
of them, like a feature list or a settings menu. It is wrong as the shape of a
whole page.

## Say it once

Repetition reads as filler, and it makes the reader check whether the second
copy says anything new.

- The landing demo had six tabs: Capture, Organize, OCR, Storage, API, Roles.
  Directly under it, six cards listed the same six. Keep one.
- The Demos page opened with a section describing the homepage's demo: its
  tabs, what Pause does, how it behaves with reduced motion. A page does not
  document another page, and a demo that needs a manual is the wrong demo.
- An app screen opened like this:

  ```
  YOUR FILES
  Upload files
  Upload and share files, with optional password protection.
  ```

  It became `Upload files`. The eyebrow names the nav item the user just
  clicked. The subtitle restates the title. Keep an eyebrow or subtitle only
  when it says something the title doesn't, such as a state or a consequence:
  "Files here are deleted after 30 days."

## Labels

**Don't label the obvious.** A label earns its place by removing a doubt. A
person does not put a sign reading "door" on a door. Label everything and the
labels that matter get lost, and small strings attached to nothing pile up
around the page.

All of these went:

- "Interactive demo" printed on the demo.
- The category word printed on each of 33 cards, under a row of filters that
  already sorts them by category.
- A permanent "Enlarge" chip on top of every screenshot. Images that open on
  click don't need a sign.
- "33 of 33 capabilities". A count says something only once a filter has
  changed it.
- "Sample data · no account connected" under the demo.

**Helper text works the same way.** This kind is noise:

```
Display name
[                    ]
This is the name that will be shown on your profile.
```

This kind earns its place, because the limit is something the user can't
guess and will run into:

```
Drag and drop files here, or click to select
Maximum file size: 100 MB
```

Helper text is for formats, limits and consequences. If the label already
says it, add nothing.

**Keep them short.** Navigation is scanned, not read. "Feature explorer",
"Interactive demos" and "Frequently asked questions" became "Features",
"Demos" and "FAQ". The dropped words carried nothing: every features page is
there to be explored. Use the shortest name a newcomer still recognises.
Renaming a label does not mean renaming its URL. Keep routes stable.

## Plain words

**No slogans.** "A home for your files. Built around you." "Make it part of
your workflow." "A closer look at Stow." Try the heading on a competitor's
site, or on a different kind of product. If it fits unchanged, it says nothing
here. A heading names what is under it: "Features", "Integrations", "Demos".

**Don't narrate the page.** "Filter the capabilities below." "Each card leads
to a complete guide with instructions and important limits." "Explore real
screens before you install." The controls are visible and the reader will use
them without being told.

**One plain line.** When a page gets an intro, default to a title and one flat
line that says what this is:

```
Everything Stow does. Pick one to see how it works.
```

A few words on where to go next are fine, as here. A paragraph is not, and
neither is a chattier version: "Here's what Stow can do. Search for something,
or filter by what you're trying to get done." sounds friendly and spends its
words explaining a search box.

## True but secondary

Thoroughness is not the problem. Position is. A permission caveat, a version
note, an edge case or a piece of history can be accurate and still not belong
where it sits. What to do with it depends on the page:

- **Landing and marketing pages: cut it.** The reader is deciding whether they
  care. Check that the docs cover what you cut. If they don't, move it there
  instead of dropping it.
- **Docs and app screens: move or collapse it.** Put it where it becomes
  relevant (next to the step it affects, in a troubleshooting section, on the
  reference page for that topic) or behind a disclosure. Don't delete facts
  from documentation to make it shorter. Complete docs with the instructions
  first beat short docs with holes.

## Landing pages

A landing page is the first impression for someone deciding whether to try
the product. That decides what belongs:

1. What it is, in one line.
2. The real product, shown once.
3. How to get it.
4. Three or four things it does, in plain words, each linking deeper.

Details for people who already run it belong in the docs: storage backends,
scoped API tokens, signed webhook events, role grants. The old landing page
offered "scoped API tokens and signed webhook events" to someone who had not
yet seen what the product looks like.

## Show the real product

The landing demo was a hand-drawn imitation of the app with made-up files,
six auto-advancing tabs, a progress bar and captions. Autoplay was not the
problem. These were:

- **It was not the product.** A showcase shows the actual app: real
  screenshots or a recording of the real UI, with demonstration data. A
  drawing proves nothing about what the reader will get, and it needs a
  disclaimer the real thing would not.
- **Six things, none shown well.** One thing shown properly, such as a
  screenshot going from capture to a shareable link, beats a skim of six.
- **The motion was invented, and looked cheap.** A recording brings the
  product's own motion with it. Anything animated by hand has to hold up next
  to the real app. If it doesn't, use a still.

If there is nothing real to capture yet, leave the showcase out and say so in
your report. A placeholder drawing tends to ship. If a simulation is truly
unavoidable, label it once, plainly.
