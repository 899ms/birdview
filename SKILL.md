---
name: birdview
description: Build an evidence-linked system map and express AI coding plans and activity against stable architecture modules. Use when users want Birdview, architecture-level coding collaboration, or visibility into where an AI plans to change a system.
---

# Birdview

[中文](SKILL.zh.md)

Show AI-declared changes on an evidence-linked architecture map.

## Workflow

1. Follow [map-project.md](references/map-project.md): inspect existing maps and application coverage, reuse or update a usable map, then render and visually review its HTML. Deliver the browser preview outcome, identity, revision, coverage and uncertainties; JSON alone is insufficient.
2. Only with that map and a user-authorized coding task, follow [show-changes.md](references/show-changes.md), the activity schema and example stream. Declare scope before editing and bind every operation to the same map revision.

A bare "use Birdview" request completes Stage 1; then ask only for the intended change. If a task is already supplied, continue to Stage 2. Never invent tasks or events for demonstration.

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
