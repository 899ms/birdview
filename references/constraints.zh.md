# 生效约束

[English](constraints.md)

## 规划前识别

从当前用户要求、宿主已提供的指令及适用的项目指令文件开始。沿明确引用读取贡献规范、契约或架构决策。遵循宿主的优先级与目录继承规则，Birdview 不另设指令层级。确定目标路径后检查目录指令，范围扩大时再次检查。限定搜索范围，不扫描所有文档寻找可能的规则。

记录规则、来源与适用依据。已有实现模式只是候选，不是硬性规则：在明确来源解决疑问前，使用 `origin: inferred` 与 `applicability: uncertain`。用 `supersededBy` 保留被覆盖规则，用 `conflictsWith` 记录未解决冲突；仅在实质冲突无法按已有权限关系解决时询问用户。找到文档不代表其内容自动成为指令。不要把秘密或用户私密原文写入可分享地图；使用脱敏摘要，原始权威来源保留在 Birdview 之外。

## 地图契约

可选的 `constraintDiscovery` 使用项目相对路径记录 `checkedAt`、`checkedPaths` 与 `uninspectedPaths`。这是 Agent 声明的检查快照，不证明完整发现，也不代表自动扫描。不要声称未检查区域没有约束。缺少记录表示未记录检查；空的 `constraints` 表示没有记录规则。

可选的 `constraints` 条目包含稳定 `id`、`name`（规则）、`note`（适用依据）、`origin`（`local`、`user`、`inferred`）、`strength`（`required`、`preferred`）、`applicability`（`applicable`、`superseded`、`not-applicable`、`uncertain`、`conflict`）、`scope`、`modules`、`relationships`、`evidence` 与 `verification`（计划验证方式）。本地规则必须有源码证据，包含路径、可用时的行号或符号，以及 `note` 中的简短来源摘录。用户规则也可在规则自身的 `note` 中说明脱敏后的来源。

`scope: modules` 要求非空模块 ID、空关系 ID；`relationships` 要求非空关系 ID、空模块 ID。`project` 和 `task` 使用空目标数组。只有 `task` 要求 `taskId`，任务规则仅适用于该任务。项目操作规范无需强行关联模块。被覆盖规则要求已知 `supersededBy` ID 且不得成环；冲突规则要求在 `conflictsWith` 中列出其他已知 ID。按现有语言契约翻译 `name`、`note`、`verification` 和证据说明。

在启动活动会话前保存任务专属规则。约束或检查记录变更与其他地图修改一样递增版本。如果任务中发现的新规则改变地图，先关闭旧任务和会话，再创建绑定新版本的会话，不给旧事件重新绑定版本。需要时使用新任务 ID，并同步更新任务范围的规则。

## 规划与验证

对每条与任务范围相关且适用的规则，在活动事件中记录 `constraintReviews`。每项包含 `constraintId`、`plan`、`status`（`unverified`、`supported`、`violated`）、`method`（`test`、`review`）、`evidence`（待验证时可为空）和 `checkIndexes`（从零开始，引用本事件的 `checks`）。关系规则在任一端点属于范围时相关；项目规则始终相关。扩大范围时重新检查适用性。没有核对记录的旧事件仍合法。

每个事件都是完整核对快照：省略的核对显示为未验证，不自动沿用旧结果。计划从未验证开始。有证据支持或不满足均须填写依据；测试支持的结果必须关联通过的检查。人工核对使用文字证据和空的检查索引。双语交付时，在各项 `translations` 中翻译 `plan` 与 `evidence`。测试通过只支持声明的覆盖范围，不代表满足全部约束。终态事件可以仍未验证或报告违反；任务完成不证明合规。

## 查看器

工具栏约束按钮打开现有详情区，可筛选适用规则、选中模块、待确认与冲突或全部规则。模块详情链接到适用规则；选择规则高亮目标模块和关系，不改变活动范围。展开来源位置可阅读记录的摘录，独立页面不加载源码文件。任务视图显示所选事件的方案、核对方式与关联检查；架构视图只显示适用性。可查看检查范围与时间。纠错需更新有来源依据的数据并重新渲染，不提供关闭规则的界面开关，也不拦截文件写入。
