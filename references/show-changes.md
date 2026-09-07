# Stage 2: Express the change

Input: a usable architecture map and a user-authorized coding task.
Output: ordered JSONL events conforming to `schemas/activity.schema.json`.
Read `contract.md` for transitions and cross-reference rules.

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

For now, report the architecture table and current intent in the conversation.
The standalone `examples/spotlight-demo.html` demonstrates these records with
scope outlines, a brighter current target and stage labels using fictional data.
It does not consume live coding events. A future display
receipt will only confirm rendering, not human approval or code correctness.
