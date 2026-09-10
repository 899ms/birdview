# Stage 2: Express the change

[中文](show-changes.zh.md)

Input: a usable architecture map and a user-authorized coding task.
Output: ordered JSONL events conforming to `schemas/activity.schema.json`.
Read `contract.md` for transitions and cross-reference rules.

Stage 1 is a prerequisite. Use the project map it selected and checked, including
its exact `project.id`, `mapId`, `revision` and existing module IDs. If no usable
map has been established, return to the discovery/reuse steps in `map-project.md`
before emitting activity. Never substitute the fictional example or infer target
IDs from prose alone. Resolve missing or stale architecture coverage in Stage 1;
keep genuinely unmapped files explicit as described below.

1. Before editing, append `planned`: the overall `scope`, current `targets`,
   project-relative file paths, and a short reason expressed in module terms.
2. Before each group of edits, append `editing`, keeping the complete scope and
   narrowing targets to the modules being edited now. List concrete edit paths.
3. Before running checks, append `verifying`. Verification files can be test or
   fixture paths and are not automatically attributed as modified files.
4. Append `completed`, `failed` or `cancelled` when the task ends. Include the
   real commands, exit codes and observations in `checks` when applicable.

All events in this version are `agent-declared`; event names are not automatic
filesystem observations. Keep validation pending until checks actually ran.
Do not label a task successful merely because emitting its event succeeded.

Each event carries the full scope and targets; consumers do not need to infer
them from prose. If scope must expand, emit another `planned` event explaining
the change before editing the added modules. An `editing` event may not quietly
broaden the declared scope.

Files absent from the ownership map remain in `files` and must also appear in
`unmappedFiles`. Do not invent a module assignment to make validation pass.
For mapped edits, target every matching owner; refine overly broad or overlapping
ownership rules in Stage 1 when that would misrepresent the actual system.

Use one active task per session in v0.1. Start a new task ID after a terminal
event. Add monotonically increasing session sequence numbers; never reuse task
IDs within that session. Keep the same project ID and map revision throughout a
session. A new map revision starts a new session and event file.

## Preview boundary

Render the selected architecture and its activity file after publishing records:

```sh
node <skill-root>/scripts/render.mjs <map.json> <activity.html> <activity.jsonl>
```

The renderer validates the entire stream against the map before writing HTML.
Version mismatch, invalid transitions and inconsistent file ownership fail without
replacing the previous output. Deliver/open the new HTML only after successful
rendering. Real activity starts at the latest record; simulations start at the
first plan. The page provides architecture, changes and comparison modes, with
history selection and collapsible file/check details. Comparison uses the same
module positions with linked selection, zoom and scrolling; narrow screens stack
the two panes. Planned targets are highlighted before editing begins. Scope is
outlined, while non-target modules are muted. Verification targets are labelled
separately from edit targets. The phase, files and checks describe that
record, not a cumulative Git diff. Terminal records remove current-target glow;
completion with no executed checks must remain explicitly unverified.

Use `--simulation` only for fictional records, such as
`examples/harness.activity.jsonl`; never label those as observed edits. Activity
text uses optional event `translations[locale].reason` and check
`translations[locale].summary` when supplied, falling back to the original text.
Supply these translations for each supported language in bilingual activity views.
This is a file snapshot: regenerate and refresh to see new records. No browser
file upload, automatic refresh, live interception or Git verification is provided.
A future display receipt will confirm rendering, not approval or correctness.
