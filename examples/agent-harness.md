# Agent Harness example

This is a conceptual architecture for demonstrating Birdview, not a map of
Birdview's implementation or any particular coding agent. All `src/` ownership
paths in the example are illustrative. The supported status denotes the authored
example design, not inspected production code. No live execution is connected.

The workbench sends goals to session control. A scheduler dispatches an agent
loop, which requests composed context through a model gateway. Context can reuse
cached summaries. Model responses may contain text or requests for tool actions.

Policy checks gate tool execution and can request human approval through the
review interface. Approved calls go to a sandbox workspace or MCP services.
Tool results return to the loop; diffs and verification output reach review.
The loop persists events and checkpoints for session recovery and progress display.
Review feedback may revise the goal. These arrows describe logical interactions,
not mandatory synchronous calls or a guarantee of secure sandboxing.

Three groups distinguish interaction, runtime responsibilities and external
execution/services. They do not assert deployment or trust boundaries.

The example intentionally includes fan-out, return paths, approval round trips,
cache and persistent storage, and long connections across groups. Names,
responsibilities and relationship descriptions are available in Chinese and English.
