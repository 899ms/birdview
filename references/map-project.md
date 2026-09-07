# Stage 1: Map the project

## Inputs and output

Input: a project root, the user's intended scope, and an existing map if present.
Output: `architecture.json` conforming to `schemas/architecture.schema.json`
and a standalone `architecture.html` rendered from that same data.
Use `examples/architecture.json` only for field shape; its system is fictional.
For new maps, read `bilingual.md` and establish the user's language choice before
generating architecture text. Use strict bilingual validation only for bilingual
delivery. Reusing a map preserves its established languages unless asked otherwise.

## Discover before building

First inspect any architecture path supplied by the user or referenced in the
project's instructions. Then check the project's existing artifact location,
including `.birdview/`, and architecture files in the project root and `docs/`.
Use bounded filename searches for architecture/map JSON, HTML, Markdown or
Mermaid artifacts; exclude dependencies, generated output and skill examples.
Expand the search only when these locations or project references give no result.

Read candidate content; a matching filename does not prove that a map is usable.
Confirm that it describes this project and covers the relevant responsibilities.
For Birdview JSON, run the map validator and check ownership and source evidence
against current files in the relevant scope. Schema validity alone does not prove
freshness. Prefer the user's selected map or the project's documented canonical
map; ask only when competing candidates cannot be resolved from that evidence.

Reuse compatible data in its existing location. If the existing diagram uses a
different format, use it as evidence and derive Birdview JSON after checking the
source, preserving meaningful identities and the original artifact. If only HTML
or an image exists, establish the underlying module/ownership data before Stage 2.
Update stale portions of an existing map rather than regenerate it by default.
Build a new map only when no usable existing map can be reused or adapted.
If validation cannot run, report that limitation and resolve it before Stage 2.

Render and deliver the selected map using the steps below. Report its path,
`project.id`, `mapId`, `revision`, coverage and uncertainties alongside the HTML.
When no coding task was supplied, stop after this visual architecture
result and ask for the intended change; do not offer rebuilding and change
tracking as interchangeable next steps.

## Build or refine the map

For missing or stale coverage, start at the README, application entrypoints and relevant package configuration.
Trace the main request or data path into the core modules. Read the surrounding
symbols before assigning responsibility; folder names alone are insufficient.
Stop when the requested scope can be described coherently. Do not enumerate every
file or claim repository-wide coverage from a partial inspection.

Aim for roughly 6-10 meaningful modules in the first view. This is a readability
target, not a requirement to invent or omit modules. Name responsibilities in
the project's vocabulary. Include external services when they explain a real
relationship; do not assign local file ownership to them.

For each local module record:

- `id`: stable identity, independent of its display name.
- `responsibility`: what it owns, not a list of filenames.
- `ownership`: exact files and directory prefixes, with separate `kind` values.
- `evidence`: paths and optional symbols/line spans, plus what they support.
- `status`: `supported` when inspected evidence supports the summary, otherwise
  `uncertain`, with a specific `openQuestions` entry.
- `layout`: a nonnegative row and column hint for a future stable grid renderer.

Record directed relationships with a concrete label, such as "loads products".
Give each relationship evidence and a status. `supported` means the author has
inspected supporting code, not that Birdview has statically proved the relation.

Show an architecture table with module, responsibility, ownership, evidence and
uncertainty columns, plus a short relationship list. Both are projections of the
same JSON. Let the user correct the model; do not force a redundant approval
round when their instructions already authorize continued work.

## Reuse and updates

Store task artifacts in an agreed project location, default `.birdview/`, without
overwriting an unrelated file. Read an existing map before replacing it.
`project.id` and `mapId` are authored local identities; they need not be public
URLs. `project.revision` optionally records a Git commit, and is not the map's
revision or proof of a clean working tree.

Increment `revision` for any saved map change, including layout. Preserve IDs
where responsibilities persist. Do not reuse a removed ID for a different role.
Complete or cancel a task on its old map before starting a new task against the
updated revision. Do not silently replay old events onto the replacement map.

## Render and deliver

After establishing or updating the JSON, run the bundled renderer using absolute
paths when the working directory is the user's project. Here `<skill-root>` is
the directory containing this SKILL.md, not the user's project root:

```sh
node <skill-root>/scripts/render.mjs <project-root>/.birdview/architecture.json <project-root>/.birdview/architecture.html
```

Use the selected JSON's actual location when reusing another project path. Keep
the HTML in the agreed artifact location and avoid replacing unrelated files.
The renderer validates the map before writing a self-contained HTML file; the
page requires no server or network assets. Do not handcraft a different viewer
or use the fictional spotlight demo as the real project's architecture.

Open the generated HTML as a visible browser preview, not as an editor file tab.
In Codex, when `open_in_codex` is available, use a browser target with the HTML's
properly encoded file URL, for example
`{ "target": { "type": "browser", "url": "file:///D:/Project/.birdview/architecture.html" } }`.
Do not use a file target for the primary visual delivery. A Markdown file link
may open the source editor, so providing that link alone does not establish that
the user has seen the diagram.

Use available browser inspection to check that module names, relationships and
selected-module evidence render correctly. A queued open request only confirms
that a preview was requested; it does not confirm visible rendering. A separate
headless browser check verifies the artifact, not the user's visible browser tab.
Report these outcomes accurately rather than calling all of them "displayed".

If browser access is unavailable or denied, report the actual tool limitation
and provide the absolute HTML path as a fallback, clearly labelled as the HTML
file. Explain that opening it in a browser displays the diagram, while an editor
shows source. Do not retry a denied action through a different mechanism to evade
the restriction. Do not blame the template without evidence of a rendering error.

Lead the delivery with the browser preview outcome and the HTML artifact; JSON
is supporting data. If rendering fails, fix the error or report the blocker
explicitly. Do not describe a JSON-only result as completed visual architecture.

This view is an architecture snapshot. It does not display live coding activity.
