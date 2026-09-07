# Stage 1: Map the project

## Inputs and output

Input: a project root, the user's intended scope, and an existing map if present.
Output: `architecture.json` conforming to `schemas/architecture.schema.json`.
Use `examples/architecture.json` only for field shape; its system is fictional.

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

Report the selected map path, `project.id`, `mapId`, `revision`, coverage and
uncertainties. When no coding task was supplied, stop after this architecture
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
