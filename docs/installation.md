# Install Birdview

[中文](installation.zh.md)

## Codex

Install Node.js 18 or newer. Download and extract the source archive for the release you want from this repository's GitHub Releases page. Place the complete extracted directory at `~/.agents/skills/birdview` (`~` is your user home). `SKILL.md` must be directly inside `birdview`, not inside another nested directory. Keep the scripts, schemas, assets, references, documentation, examples, package files and license notices together; copying only `SKILL.md` is insufficient.

Install renderer dependencies in that directory:

```powershell
# Windows PowerShell
npm --prefix "$HOME/.agents/skills/birdview" ci
node "$HOME/.agents/skills/birdview/scripts/validate.mjs" "$HOME/.agents/skills/birdview/examples/architecture.json"
```

```sh
# macOS / Linux
npm --prefix "$HOME/.agents/skills/birdview" ci
node "$HOME/.agents/skills/birdview/scripts/validate.mjs" "$HOME/.agents/skills/birdview/examples/architecture.json"
```

The validator should report `"ok": true`. Start a fresh Codex task in your target project and ask: "Use Birdview to show this project's architecture; do not edit code." Confirm that Codex reads the skill, reports whether an existing map was found, and produces or updates an HTML preview. Successful validation alone does not verify agent activation.

Codex's [official skill documentation](https://developers.openai.com/codex/skills) lists `~/.agents/skills` for user skills and `.agents/skills` for repository skills. Codex detects changes automatically; restart it if the skill does not appear. Avoid duplicate installations named `birdview`, including older client-specific skill directories. Other agents need a skill location supported by their host; no universal installer is provided.

## Choose a mode

The distributed skill defaults to **auto**. It instructs the agent to inspect/reuse or update the map and declare affected modules before every code change. For explicit activation only, run the following with absolute paths substituted:

```sh
node <skill-root>/scripts/birdview.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdview.mjs mode --project <project-root>
```

Use `mode auto` to switch back. An explicit project setting overrides the default. The CLI manages a block in the target project's `AGENTS.md`; it does not configure all projects. See [mode details](../references/modes.md). These are agent instructions, not enforced interception of edits.

## Update or remove

Before updating, preserve any local skill customizations and note the installed version. Replace the installed source with the chosen release and rerun `npm ci`; release defaults can overwrite local customizations. Project mode blocks remain in their projects. Do not keep an old copy inside another scanned skill directory.

To uninstall, remove only the installed `birdview` directory. In projects where you enabled a mode, remove only the block between `<!-- birdview:mode:start -->` and `<!-- birdview:mode:end -->` from `AGENTS.md` if no longer needed. Project maps and activity records are separate data and are not removed by uninstalling the skill.

The npm package is private; `npm install -g birdview` is not this project's installation method. For development from a checkout, follow [CONTRIBUTING.md](../CONTRIBUTING.md).
