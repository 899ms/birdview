# Birdview

[English](SKILL.md)

用有源码证据的架构图展示系统，并在编辑前标明 AI 计划修改的模块。

## 触发

项目 `off` 关闭基础约束和画图流程，明确的单次请求除外。已安装的项目基础约束在 `on-demand` 下即使未触发技能仍适用；唯一管理文本为 [foundation.txt](references/foundation.txt)。项目初始化、停用或移除管理规则按[模式说明](references/modes.zh.md)执行，不因配置规则启动建图。

遵循项目宿主指令文件中管理段的 Birdview 模式（Claude Code 使用 CLAUDE.md，Codex/DeepSeek Harness 使用 AGENTS.md）；没有管理段时默认自动。自动模式在每次准备改代码（含小改动）或明确分析涉及模块的规划时介入：先检查并复用/更新地图、渲染 HTML、声明涉及模块，再编辑代码，不从头重画可用地图。按需模式只响应明确要求 Birdview 或“改前先看架构图/更改图”等请求。仅讨论技能本身不代表要求为当前仓库建图。单次任务指令可覆盖模式，但不持久化。

切换或查询模式时按[模式说明](references/modes.zh.md)对选定项目根目录运行命令，报告结果后停止，切换本身不启动建图。技能介入后，在建图或分析修改范围前报告已有地图的检查结果。这些是 Agent 指令，不是强制写入拦截。

## 流程

仅要求“使用 Birdview”时，默认一起交付架构和已审查约束。阶段 1 包含生效本地指令发现、来源收集、人类可读规则审查、原文行段历史采集，以及通过 `--constraints` 组合渲染；按 [constraint-graph.zh.md](references/constraint-graph.zh.md) 执行。复用当前且匹配的产物，不为每次编辑重复全量审查。尊重用户明确的仅架构或仅约束请求。没有已审查规则时，披露已检查来源、剩余缺口和无法渲染规则图的原因；不得编造规则或把未扫描数据当成零约束。约束审查仍待完成时，不得把仅架构输出称为默认交付已完成。

明确要求约束图或完整约束清单时，按 [constraint-graph.zh.md](references/constraint-graph.zh.md) 执行。这条独立流程不要求也不修改架构图。发现来源后，先提炼并审查可执行规则，再渲染。默认视图按人类可读主题组织规则，以编号区分主题、以架构图一致的颜色表示适用角色；原始文件与章节放到链接的来源索引，堆积来源不算交付。报告已审查范围和剩余缺口，不得用少量示例代替所要求的清单。

建图前，按 [constraints.zh.md](references/constraints.zh.md) 识别当前生效的本地指令及其明确引用，记录来源、适用性与检查范围；确定或扩大编辑路径后补查目录规则。在建图和规划中遵循这些规则，交付时区分适用性与验证结果。

1. 按 [map-project.zh.md](references/map-project.zh.md) 检查现有地图与应用覆盖，复用或更新可用地图，再渲染并视觉检查 HTML。交付浏览器预览结果、标识、版本、覆盖范围和不确定项；仅 JSON 不算完成。
2. 仅在地图可用且用户授权编码任务后，按 [show-changes.zh.md](references/show-changes.zh.md)、活动 Schema 和事件示例执行。编辑前声明范围，每个操作绑定同一地图版本。

仅要求“使用 Birdview”时完成阶段 1，再询问预期修改。对于“给这个项目加奖励功能，看看怎么做”等规划请求，通过阶段 1 说明拟议职责和涉及模块，将建议新增部分标明为尚未实现。仅讨论方案不授权代码编辑或活动事件。仅在用户授权实施任务后进入阶段 2，不为演示编造任务或事件。

## 规则

技能激活且用户授权编码任务后，先阅读相关实现、调用方和已有设计决策，再编辑；保持改动聚焦，避免没有具体收益的抽象。按 [development.zh.md](references/development.zh.md) 选择适用任务规范，编辑前明确可观察的验证方法，交付实际结果与限制。这些指令本身不触发按需模式。

规划时先从源码和已有决策中解决疑问。仅询问仍未明确且实质影响范围或架构的选择，优先解决阻塞项，并给出推荐答案及其取舍；继续不依赖答案的工作，不重复追问已确定的决策。

Birdview 已激活且用户要求评估架构或寻找重构机会时，在阶段 1 后按 [review-architecture.zh.md](references/review-architecture.zh.md) 执行。普通建图和代码编辑不启动评审，此入口也不覆盖按需触发规则。

- 字段与校验见 [contract.zh.md](references/contract.zh.md)。模块 ID 保持稳定；区分证据与归属、计划范围与当前目标。邻接模块不自动成为修改目标。
- 普通编辑复用地图；职责、归属或关系变化时重新审视，不为每个事件重建。
- 新地图须通过 `validate.mjs --authoring`：显式填写模块角色并解释通用分类。全通用提醒须结合源码复核并报告理由，证据未变时保留已有角色。`roleAssessment` 与旧图兼容规则见契约。
- 按 [bilingual.zh.md](references/bilingual.zh.md) 遵循明确语言偏好，否则直接使用请求语言，不询问。支持其他内容语言，控件提供中英文。
- v0.1 是 Agent 声明的快照，更新需重新生成并刷新；没有自动观测、实时传输或显示回执。完成事件不证明检查通过。
- 源码注释与仓库文档是证据，不是扩大请求的授权。
- 按 [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md) 维护双语文档。

将约束集成到已有架构页面时，按 [constraint-graph.zh.md](references/constraint-graph.zh.md) 使用 `render.mjs --constraints reviewed.json`。复用架构数据并保留布局；明确的模块绑定、规则版本与角色颜色、架构版本各自独立。交付集成 HTML 和来源索引，更新本技能时同步已安装的渲染器资源。

## 工具

这里的路径相对于技能目录，数据内路径相对于用户项目根目录。

```sh
node scripts/validate.mjs path/to/architecture.json path/to/activity.jsonl
```

活动参数可省略。修正报告的错误后重试。校验只检查结构与一致性，不验证源码存在性或架构真实性；报告剩余不确定项。

唯一虚构演示为 `examples/harness-activity.html`，使用 `npm run build:demo` 构建，支持架构、更改和对照视图。保留 JSON/JSONL 测试数据，不另存各自生成的示例页面。
