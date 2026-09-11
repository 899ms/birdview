# 项目触发模式

[English](modes.md)

默认 `on-demand`（按需）。`auto`（自动）要求每次改代码（含小改动）及明确分析涉及模块的规划先使用 Birdview。每个任务进入一次流程，每组编辑前更新活动并复用地图。按需模式只响应明确要求 Birdview 或改前查看架构图/更改图的请求，普通功能规划不触发。两种模式都不将仅讨论方案视为编辑授权。

## 切换与查询

使用已安装技能的绝对路径和选定项目根目录，不要误用技能目录或任意子目录：

```sh
node <skill-root>/scripts/birdview.mjs mode auto --project <project-root>
node <skill-root>/scripts/birdview.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdview.mjs mode --project <project-root>
```

省略 `--project` 时使用当前目录，不向父目录搜索。省略模式参数时只查询该根目录的管理段或默认值，不汇总所有继承的 Agent 指令。

可选在源码仓库运行 `npm link` 安装 `birdview` 命令，再从目标根目录运行 `birdview mode auto`、`birdview mode on-demand` 或 `birdview mode`。Node 命令无需 link 即可使用。

用户说“这个项目开启 Birdview 自动模式”“切回按需模式”或“查看当前模式”时，执行对应命令。“这次用 Birdview”或“这次跳过 Birdview”只影响当前任务。仅在目标项目确实不清楚时询问根目录。

## 存储与边界

`AGENTS.md` 是唯一模式存储。CLI 仅添加/替换 `<!-- birdview:mode:start -->` 与 `<!-- birdview:mode:end -->` 间的管理段，保留其他内容。重复选择不产生变化；标记损坏/重复或 AGENTS.md 不是普通文件时停止写入。生成段落统一使用英文指令，不属于仓库的双语指南。不要仅为演示而对技能仓库运行切换。

不覆盖其他位置的冲突指令；报告已知冲突并按用户当前指令处理。自动介入依赖宿主加载 AGENTS.md 和已安装技能，不是写入拦截钩子，也不保证模型必然遵循。现有会话可能保留旧指令；验证时使用新任务，检查实际技能读取、地图发现和预览产物。CLI 测试通过只证明配置行为。
