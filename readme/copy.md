# README copy

Every word on the README panels comes from this file. Edit text under a
heading, then run `npm run render` in `readme/`. Markdown (code, links) is
fine in text that only appears in README.md. A value of TODO shows up on
the panel as a visible placeholder; NONE leaves that piece out. Blank lines split paragraphs.

## tagline
My agent toolkit, designed to give agents autonomy and hold themselves to a high standard.

## pitch
most agent setups make agents faster. tinderbox is setup for them to finish. every skill here is to get an agent to work at a high level of depth and quality.

i've found that slop can be largely preventable given the right agent setup - although i do believe human review is still important.

tinderbox is a collection of what works for me. some of it comes from other agent setups, some of it is tailored to how i work, some is left as is, and some is fully custom. it's the setup that works best for me, so take what's useful and change the rest.

## defaults-intro
tinderbox ships with a couple of different opinionated defaults. mainly aimed around giving agents the tools to validate, test, and review their changes before handing off to you.

<!-- One card per default: "Title: one line", or just a title. -->

## default-deliver
deliver the whole ask

## default-evidence
all frontend changes must be validated with demos prepared

## default-worktrees
agents must use isolated worktrees and not step on eachother

## default-identity
always preserve product identity

## default-followthrough
follow any PR to completion, monitor CI and address reviews

## default-asked
only perform git actions when requested

## default-versions
always back everything in the repo being worked on and official docs

## flow-intro
every task goes through the same four layers. the rules load first, the router figures out what kind of work it is, and the right skills take it from there.

## flow-always
the global rules every session starts with, for both claude code and codex.

## flow-router
delivery owns the task end to end and hands ui, pr and media work to the skill built for it.

## flow-method
how the work actually gets done, with a strong set of standards.

## flow-kits
narrow skills that load when an agent touches their area.

## inside-intro
NONE

## autosync-intro
this repo should automatically update when my agent setup changes.

## install-intro
this is built around my opinions, so please feel free to change anything that is different from how i work. contributions welcome!

## install-notes
skills install to `~/.agents/skills` (codex) and symlinks them to `~/.claude/skills` (claude code). Anything the installer replaces will move to `~/.local/share/tinderbox/backup/<timestamp>/`. routing details are in [docs/ROUTING.md](docs/ROUTING.md).

to give an idea on how to build on top of tinderbox, i also publish my personal adjustments as an example, which you can see as a reference under [router/personal/flint.md](router/personal/flint.md).
