# Project activation modes

[中文](modes.zh.md)

Default: `on-demand`. `auto` requires Birdview before every code-changing task, including small edits, and planning that explicitly analyzes affected modules. Enter once per task; update activity before edit groups and reuse maps. `on-demand` requires a direct Birdview request or a request to see the architecture/change map before edits; ordinary feature planning does not activate it. Neither mode authorizes edits from a planning-only request.

## Switch or inspect

Run with the installed skill's absolute path and the selected project's root, not the skill directory or an arbitrary subdirectory:

```sh
node <skill-root>/scripts/birdview.mjs mode auto --project <project-root>
node <skill-root>/scripts/birdview.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdview.mjs mode --project <project-root>
```

Without `--project`, the command uses the current directory; it does not search parent directories. With no mode argument it only reports the selected root's block or the default, not all inherited agent instructions.

From a source checkout, `npm link` optionally installs the `birdview` command. Then run `birdview mode auto`, `birdview mode on-demand`, or `birdview mode` from the target root. The Node commands work without linking.

Users may say "enable Birdview auto mode for this project", "switch to on-demand", or "show the current mode"; invoke the corresponding command. "Use Birdview this time" or "skip Birdview this time" changes only the current task. Ask for a root only if the target project is genuinely unclear.

## Storage and boundaries

`AGENTS.md` is the sole mode store. The CLI adds/replaces only the block between `<!-- birdview:mode:start -->` and `<!-- birdview:mode:end -->`, preserving other content. Repeated selection is idempotent; malformed/duplicate blocks or non-regular AGENTS.md files fail without writing. The generated block uses English instructions in either UI language; it is not a paired repository guide. Do not run this command on the skill repository merely to demonstrate it.

Do not overwrite conflicting instructions elsewhere. Report known conflicts and resolve against the user's current instruction. Automatic activation depends on the host loading AGENTS.md and the installed skill; this is not a write-blocking hook or a guarantee of model compliance. Existing sessions may retain old instructions; when testing, use a fresh task and inspect actual skill reads, map discovery and preview output. A successful CLI test proves configuration behavior only.
