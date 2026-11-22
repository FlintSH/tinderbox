# pstack model configuration for Antigravity. One line per role. Delete a line to fall back to the skill default.
# Antigravity subagents take a model tier (`pro`, `flash` or `inherit`), not a model slug. `inherit-parent` or `auto`: the role runs on the parent model.
# tinderbox default for Antigravity. Cross-provider review with Claude and GPT stays with the tstack `council` skill.
# budget: large
feature, refactoring: inherit-parent
bug-fix: inherit-parent
perf-issue: inherit-parent
hillclimb: inherit-parent
judgment and prose: pro
hardest tasks: pro
how explorer: flash
how explainer: pro
why investigators: flash
why synthesizer: pro
reflect tooling: flash
reflect judgment, divergent, synthesizer: pro
arena runners: pro, flash
arena cross-judge pool: pro, flash
swarm workers: flash
architect runners: pro, flash
interrogate reviewers: pro, flash
