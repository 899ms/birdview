<div align="center">
  <h1>Birdview</h1>
  <p><strong>Architecture-first visibility into agent-declared coding changes.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/version-0.1.0-2f81f7?style=flat-square" alt="Version 0.1.0">
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js 18 or newer">
    <img src="https://img.shields.io/badge/tests-40%20passing-2da44e?style=flat-square" alt="40 tests passing">
    <img src="https://img.shields.io/badge/output-standalone%20HTML-e34f26?style=flat-square&amp;logo=html5&amp;logoColor=white" alt="Standalone HTML output">
    <img src="https://img.shields.io/badge/docs-English%20%7C%20%E4%B8%AD%E6%96%87-8250df?style=flat-square" alt="English and Chinese documentation">
  </p>
</div>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="examples/harness-activity.html">Live Demo</a> ·
  <a href="README.zh.md">简体中文</a>
</p>

<!-- [简体中文](README.zh.md) -->

Birdview turns evidence-backed architecture descriptions and agent-declared activity records into a standalone, interactive HTML view. It keeps system structure, file ownership, change scope, and verification results on one stable map so reviewers can see where work is happening and why.

<p align="center">
  <img src="docs/birdview-overview.png" alt="Birdview activity view" width="100%">
</p>

> The screenshot uses the fictional agent harness included in this repository. It does not represent observed production activity.

## Why Birdview

AI coding logs explain what happened over time, while diffs explain which lines changed. Birdview adds the missing system context: which architectural responsibilities are involved, what evidence supports the map, which modules are in scope, and what was actually verified.

Birdview v0.1 provides:

- Evidence-linked architecture maps with stable module IDs and explicit file ownership.
- Architecture, changes, and side-by-side comparison views on the same layout.
- JSON Schema and semantic validation for maps and activity histories.
- Self-contained HTML output with no server or network dependency.
- Responsive light and dark themes, relationship filtering, and module inspection.
- Chinese and English controls, plus authored content in other languages.

## Quick Start

Birdview requires Node.js 18 or newer.

```sh
npm ci
npm run validate:examples
npm test
npm run build:demo
```

Open [`examples/harness-activity.html`](examples/harness-activity.html) in a browser. The demo is a simulation built from [`examples/system.architecture.json`](examples/system.architecture.json) and [`examples/harness.activity.jsonl`](examples/harness.activity.jsonl).

## Viewer Guide

Open **Guide** in the viewer toolbar for a spotlight walkthrough: architecture, current changes, comparison, module evidence and activity history. Maps without activity show only the architecture and evidence steps. The first-visit invitation is optional; close, skip or press Escape at any time. Exiting restores the original view, record, selection and zoom. Text follows the selected Chinese/English UI language. Dismissal is remembered in browser storage when available; the toolbar always allows replay.

## Activation Modes

Birdview defaults to **auto**: every code-changing task first inspects and reuses/updates the architecture map, renders it and declares affected modules before editing. It also covers explicit affected-module planning. Projects explicitly set to **on-demand** retain that setting and require a Birdview or map-before-editing request. Say "enable Birdview auto mode for this project" or "switch to on-demand", or run:

```sh
node <skill-root>/scripts/birdview.mjs mode auto --project <project-root>
node <skill-root>/scripts/birdview.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdview.mjs mode --project <project-root>
```

The command manages only its own block in the project's `AGENTS.md`. "Use Birdview this time" does not persist a setting. This is agent guidance, not a write interceptor. See [modes and CLI setup](references/modes.md).

## Render Your Project

Create an architecture file that follows [`schemas/architecture.schema.json`](schemas/architecture.schema.json), then validate and render it:

```sh
node scripts/validate.mjs .birdview/architecture.json
node scripts/render.mjs .birdview/architecture.json .birdview/architecture.html
```

To include a declared activity history:

```sh
node scripts/validate.mjs .birdview/architecture.json .birdview/activity.jsonl
node scripts/render.mjs .birdview/architecture.json .birdview/activity.html .birdview/activity.jsonl
```

Use `--bilingual` with the validator when both Chinese and English authoring is required. Use `--simulation` with the renderer only for fictional activity records.

## How It Works

```text
project source ──> architecture.json ─┐
                                     ├──> validate ──> render ──> standalone HTML
agent declarations ─> activity.jsonl ┘
```

The architecture file defines modules, responsibilities, ownership, evidence, relationships, and layout. The optional JSONL stream binds ordered task events to a specific project, map revision, and set of module IDs. The renderer validates both inputs before producing the view.

The recommended workflow has two ordered stages:

1. Inspect the project, establish or update its evidence-backed architecture map, validate it, and review the rendered HTML.
2. For a concrete coding task, declare planned scope, current targets, files, lifecycle phase, and real check results against that same map revision.

See [Stage 1: Map a project](references/map-project.md) and [Stage 2: Show changes](references/show-changes.md) for the complete workflow.

## Data Contracts

| Input | Purpose |
| --- | --- |
| `architecture.json` | Project identity, modules, ownership, evidence, relationships, groups, and stable layout |
| `activity.jsonl` | Ordered, agent-declared task scope, targets, files, phases, and verification records |
| `architecture.html` | Generated standalone viewer containing the validated map and optional activity history |

The schemas enforce structure. [`scripts/validate.mjs`](scripts/validate.mjs) also checks cross-record rules such as stable map identity, contiguous sequences, valid scope and targets, file ownership, and consistent check results. Validation does not prove that architecture claims are true or that referenced source files exist.

## Project Layout

| Path | Contents |
| --- | --- |
| [`schemas/`](schemas) | Architecture and activity JSON Schemas |
| [`scripts/`](scripts) | Validator, standalone renderer, and documentation checks |
| [`assets/`](assets) | Shared viewer template, styling, routing, activity, and localization code |
| [`examples/`](examples) | Fictional maps, activity records, and the generated interactive demo |
| [`references/`](references) | Authoring workflow, contract, activity, and bilingual guidance |
| [`test/`](test) | Contract, rendering, and optional browser-level checks |

## Current Boundaries

Birdview v0.1 is deliberately file-based:

- Activity is declared by an agent; Birdview does not automatically observe coding operations.
- Updates require regenerating the HTML and refreshing the browser.
- Live transport, automatic refresh, and rendered-display acknowledgements are not implemented.
- A `completed` event does not prove checks passed; only recorded check results make that claim.
- The package is currently marked private and is not published to npm.

## Development

```sh
npm test                 # Contract and renderer tests
npm run validate:examples
npm run build:demo       # Rebuild the fictional activity demo
node scripts/check-docs.mjs
```

Browser-level checks live in [`test/viewer.browser.mjs`](test/viewer.browser.mjs) and require a local Playwright installation or `BIRDVIEW_PLAYWRIGHT_PATH` pointing to one.

For the field semantics and invariants, read the [Birdview contract](references/contract.md). Documentation changes must follow the bilingual rules in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This repository does not currently include a license file.
