---
name: render-qa
description: Produce and verify code-rendered films, animation, browser scenes, and audio/video deliverables. Use for Remotion, Three.js, canvas, or FFmpeg media tasks that require finished artifacts, visual quality checks, and resumable multi-agent production.
---

# Deliver the actual rendered artifact

Use the project's chosen engine. Load Remotion skills only for Remotion work;
do not migrate a Three.js/canvas film merely because Remotion skills are installed.

1. Read the creative brief, storyboard, source/truth rules, ownership map and
   existing status documents. Distinguish confirmed facts from dramatization.
   Honor project privacy/redaction rules and keep credentials out of artifacts.
2. Define deliverables and measurable acceptance: duration, resolution, frame
   rate, audio format/loudness, captions, titles, typography, visual consistency,
   pacing and final export paths. Resolve consequential creative ambiguity early.
3. For a multi-agent project, identify one coordinator, one Git writer, file
   ownership and a render lock. Parallel departments must not race on generated
   assets, shared output paths, dependency installation or the final export.
4. Start with a representative short render and contact sheet. Fix engine-level
   defects before rendering the whole film. Use deterministic seeds/time and
   staged outputs. Default to one heavy render at a time unless the
   machine clearly has headroom.
5. Inspect real frames at transitions and difficult typography. Check clipping,
   contrast, legibility, caption timing, missing assets and empty/black frames.
   For audio, inspect levels, true peaks, duration, continuity and sync; use
   listening when available and state when an audio judgment is only automated.
6. Render the actual final files, then use ffprobe/FFmpeg and project checks to
   verify containers, codecs, dimensions, frame rate, duration, audio tracks,
   caption tracks and decode errors. Inspect a fresh sample of the final export,
   not just the pre-export browser preview. Record content hashes in a manifest.
7. Keep review loops focused and budget-aware. Correct concrete defects before
   convening another broad review; don't exhaust the account on duplicate panels.
   Save a concise status/handoff before session rollover.
8. Deliver reachable artifact links using the project's configured destination
   and authorized credentials. Never invent a successful upload or reuse tokens
   copied out of old chat history. Report remaining quality limitations honestly.

Prose, release notes and explanatory copy should match the user's existing
voice and any voice rules in their global instructions: direct, specific and
low-hype by default.
