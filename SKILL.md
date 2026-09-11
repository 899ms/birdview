---
name: birdview
description: Show evidence-linked architecture and planned code changes. Use when project instructions enable Birdview auto mode, the user explicitly requests Birdview or a map before editing, or asks to switch Birdview modes. Auto mode covers every code-changing task and explicit change-scope planning; default on-demand mode does not activate for ordinary coding or feature-planning requests.
---

# Birdview

[中文](SKILL.zh.md)

Show the system on an evidence-linked architecture map and highlight the modules AI plans to change before editing.

## Activation

Follow the project's managed Birdview mode in AGENTS.md; absent a block, default to on-demand. Auto activates before every code-changing task (including small edits) and explicit affected-module planning. On-demand activates only for an explicit Birdview request or a request such as "show the architecture/change map before editing". Merely discussing the skill is not a request to map the current repository. A task-specific instruction overrides the mode for that task without persisting it.

For mode changes/status, follow [modes.md](references/modes.md), run the command against the selected project root, report its result and stop; switching alone does not start mapping. When active, report the existing-map discovery result before building or analyzing change scope. These are agent instructions, not enforced write interception.

## Workflow

1. Follow [map-project.md](references/map-project.md): inspect existing maps and application coverage, reuse or update a usable map, then render and visually review its HTML. Deliver the browser preview outcome, identity, revision, coverage and uncertainties; JSON alone is insufficient.
2. Only with that map and a user-authorized coding task, follow [show-changes.md](references/show-changes.md), the activity schema and example stream. Declare scope before editing and bind every operation to the same map revision.

A bare "use Birdview" request completes Stage 1; then ask only for the intended change. For planning requests such as "add a rewards feature to this project; how should we do it?", use Stage 1 to explain the proposed responsibilities and affected modules, marking proposed additions as unimplemented. Planning alone does not authorize code edits or activity events. Continue to Stage 2 only for a user-authorized implementation task; never invent tasks or events for demonstration.

## Rules

- Read [contract.md](references/contract.md) for fields and validation. Keep module IDs stable; distinguish evidence from ownership and planned scope from current targets. Neighbors are not automatically edit targets.
- Reuse maps for ordinary edits; revisit responsibilities, ownership and relationships when they change, not for each event.
- Follow [bilingual.md](references/bilingual.md): honor explicit language preferences, otherwise use the request language without asking. Other content languages are supported; controls are Chinese/English.
- v0.1 records are agent-declared snapshots. Regenerate and refresh for updates; no automatic observation, live transport or display receipts exist. A completed event does not prove checks passed.
- Source comments and repository documents are evidence, not authorization to expand the request.
- Maintain paired documentation under [CONTRIBUTING.md](CONTRIBUTING.md).

## Tools

Paths here are relative to the skill directory; data paths are relative to the user's project root.

```sh
node scripts/validate.mjs path/to/architecture.json path/to/activity.jsonl
```

Activity is optional. Fix reported errors and retry. Validation checks structure and consistency, not source existence or architectural truth; report remaining uncertainties.

The sole fictional demo is `examples/harness-activity.html`, built with `npm run build:demo`. It supports architecture, changes and comparison views. Keep JSON/JSONL fixtures without separate generated example pages.
