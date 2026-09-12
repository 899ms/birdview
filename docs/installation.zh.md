# 安装 Birdview

[English](installation.md)

## Codex

安装 Node.js 18 或更高版本。从本仓库的 GitHub Releases 页面下载所需版本的源码压缩包并解压。将完整目录放到 `~/.agents/skills/birdview`（`~` 是用户主目录）。`SKILL.md` 必须直接位于 `birdview` 下，不能多嵌套一层目录。保留脚本、Schema、资源、参考文档、文档、示例、包文件及许可证声明；只复制 `SKILL.md` 不够。

在该目录安装渲染器依赖：

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

校验器应报告 `"ok": true`。在目标项目新建 Codex 任务，要求：“用 Birdview 展示这个项目的架构，不修改代码。”确认 Codex 读取了 Skill、报告是否发现已有地图，并生成或更新 HTML 预览。校验通过本身不代表 Agent 触发验证通过。

Codex [官方技能文档](https://developers.openai.com/codex/skills) 指定用户级技能目录为 `~/.agents/skills`，仓库级为 `.agents/skills`。Codex 会自动检测变化；技能未出现时重启。避免重复安装同名 `birdview`，包括旧客户端专用技能目录中的副本。其他 Agent 需要使用其宿主支持的技能目录；本项目不提供通用安装器。

## 选择模式

分发版本默认**自动模式**，要求 Agent 每次改代码前检查并复用或更新地图、声明涉及模块。若只想明确要求时触发，将下列占位符替换为绝对路径后执行：

```sh
node <skill-root>/scripts/birdview.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdview.mjs mode --project <project-root>
```

使用 `mode auto` 切回。项目显式设置优先于默认值。CLI 管理目标项目 `AGENTS.md` 中的一段规则，不会配置全部项目。详见[模式说明](../references/modes.zh.md)。这些是 Agent 指令，不是强制编辑拦截。

## 更新或卸载

更新前保留本地技能定制并记录安装版本。使用选定版本替换已安装源码，再运行 `npm ci`；版本默认值可能覆盖本地定制。各项目的模式段落仍保留在项目中。不要将旧副本留在另一个会被扫描的技能目录下。

卸载时只移除已安装的 `birdview` 目录。对于设置过模式的项目，若不再需要，从 `AGENTS.md` 中仅移除 `<!-- birdview:mode:start -->` 到 `<!-- birdview:mode:end -->` 之间的完整段落。项目地图和活动记录是独立数据，卸载技能不会移除它们。

npm 包保持私有；`npm install -g birdview` 不是本项目的安装方式。从源码检出进行开发请参考 [CONTRIBUTING.zh.md](../CONTRIBUTING.zh.md)。
