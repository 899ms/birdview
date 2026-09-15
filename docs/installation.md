# Install Birdview

[中文](installation.zh.md)

## Multi-agent installation

Use the third-party [skills CLI](https://github.com/vercel-labs/skills) to select an agent and installation scope:

```sh
npx skills add Qiuner/birdview --skill birdview
npx skills add Qiuner/birdview --skill birdview --agent codex --global --copy --yes
npx skills add Qiuner/birdview --skill birdview --agent claude-code --global --copy --yes
```

Omit `--global` for project scope. These install the current repository version. Use the archive method below for a fixed release. In the destination printed by the installer, run `npm ci` (including development dependencies), then `node scripts/birdview.mjs doctor`. The read-only self-check validates and renders the bundled example in memory; it does not verify agent activation. The installer or agent may require a newer Node.js version than Birdview.

Claude Code also supports manual installation into `~/.claude/skills/birdview` or `<project-root>/.claude/skills/birdview`. Keep the complete bundle as described below. For mode commands, add `--agent claude-code` to write/query `CLAUDE.md`; the default manages `AGENTS.md`.

## DeepSeek Harness

Harness natively discovers `.dsh/skills` and `.agents/skills`. Install the complete bundle without a separate plugin (PowerShell or POSIX shell):

```sh
git clone https://github.com/Qiuner/birdview.git "$HOME/.dsh/skills/birdview"
npm --prefix "$HOME/.dsh/skills/birdview" ci
node "$HOME/.dsh/skills/birdview/scripts/birdview.mjs" doctor
```

If `DSH_HOME` is customized, replace `$HOME/.dsh` with that directory. For project scope, use `<project-root>/.dsh/skills/birdview`. An existing `~/.agents/skills/birdview` installation is also discoverable; avoid duplicates. Shared roots can be overridden by `DSH_AGENTS_HOME` or host configuration. Add `--agent deepseek` to mode commands; this manages `AGENTS.md`.

This targets Harness with its filesystem skill provider enabled, checked against [source revision 7a0b768](https://github.com/deepseek-ai/deepseek-harness/blob/7a0b7682b6690f0aa2d93438c4d526b38ab45777/packages/skill/skill-filesystem/src/index.ts). Follow Harness's own Node.js requirement. This is not an installation into the DeepSeek chat website. Claude Code and Harness live sessions have not been end-to-end tested here; verify activation in a fresh task as described below.

## Manual installation (Codex)

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

Codex's [official skill documentation](https://developers.openai.com/codex/skills) lists `~/.agents/skills` for user skills and `.agents/skills` for repository skills. Codex detects changes automatically; restart it if the skill does not appear. Avoid duplicate installations named `birdview`, including older client-specific skill directories.

## Choose a mode

The distributed skill defaults to **auto**. It instructs the agent to inspect/reuse or update the map and declare affected modules before every code change. For explicit activation only, run the following with absolute paths substituted:

```sh
node <skill-root>/scripts/birdview.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdview.mjs mode --project <project-root>
```

Use `mode auto` to switch back. Select `--agent codex` (default), `--agent claude-code` or `--agent deepseek` consistently for writes and queries. An explicit project setting overrides the default. The CLI manages a block in the target project's `AGENTS.md` (`CLAUDE.md` for Claude Code); it does not configure all projects or synchronize instruction files. See [mode details](../references/modes.md). These are agent instructions, not enforced interception of edits.

## Update or remove

Before updating, preserve any local skill customizations and note the installed version. Replace the installed source with the chosen release and rerun `npm ci`; release defaults can overwrite local customizations. Project mode blocks remain in their projects. Do not keep an old copy inside another scanned skill directory.

To uninstall, remove only the installed `birdview` directory. In projects where you enabled a mode, remove only the block between `<!-- birdview:mode:start -->` and `<!-- birdview:mode:end -->` from the corresponding instruction file if no longer needed. Project maps and activity records are separate data and are not removed by uninstalling the skill.

The npm package is private; `npm install -g birdview` is not this project's installation method. For development from a checkout, follow [CONTRIBUTING.md](../CONTRIBUTING.md).
