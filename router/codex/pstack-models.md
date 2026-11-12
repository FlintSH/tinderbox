# pstack model configuration for Codex. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent model (omit spawn_agent `model`).
# tinderbox default for Codex, which reaches OpenAI models only. Cross-provider review with Claude stays with the tstack `council` skill.
# budget: large (xhigh)
feature, refactoring: inherit-parent
bug-fix: inherit-parent
perf-issue: inherit-parent
hillclimb: inherit-parent
judgment and prose: gpt-6.1-sol xhigh
hardest tasks: gpt-6.1-sol xhigh
how explorer: gpt-6.1-terra high
how explainer: gpt-6.1-sol xhigh
why investigators: gpt-6.1-terra high
why synthesizer: gpt-6.1-sol xhigh
reflect tooling: gpt-6.1-terra high
reflect judgment, divergent, synthesizer: gpt-6.1-sol xhigh
arena runners: gpt-6.1-sol xhigh, gpt-6-astra xhigh
arena cross-judge pool: gpt-6.1-sol xhigh, gpt-6-astra xhigh
swarm workers: gpt-6.1-terra high
architect runners: gpt-6.1-sol xhigh, gpt-6-astra xhigh
interrogate reviewers: gpt-6.1-sol xhigh, gpt-6-astra xhigh
