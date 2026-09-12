# 贡献指南

[English](CONTRIBUTING.md)

## 开发与拉取请求

使用 Node.js 18 或更高版本。在 GitHub Fork 仓库，在自己的 Fork 中使用专注当前改动的分支，向上游默认分支提交 PR。较大的功能先通过 Issue 讨论问题。问题反馈应包含可复现步骤和脱敏输入。

```sh
npm ci
npm test
npm run validate:examples
node scripts/check-docs.mjs
```

修改查看器或渲染器时运行 `npm run build:demo` 并审阅已跟踪演示文件的 diff。验证中英文、桌面和移动端及受影响的交互。可选 Playwright 检查见[发布检查清单](docs/releasing.zh.md)。行为改动应补充回归覆盖，在 PR 模板中说明实际运行的检查和剩余限制。不要包含私有源码数据或凭据。

CI 在 Windows 和 Linux 上使用 Node.js 18、24 检查，校验文档和示例，并验证已跟踪演示与渲染器输出一致。贡献内容按仓库的 [MIT 许可证](LICENSE) 分发；保留[第三方声明](THIRD_PARTY_NOTICES)。

## 提交规则

- 未经用户明确要求，不执行 `git add`、`git commit`、`git push`、创建分支或改写历史。
- 提交标题使用 `type(scope): 中文说明 / English summary` 格式的 Conventional Commits。
- 每个提交只包含一组逻辑一致的变更；不同性质的改动必须分别暂存和提交。
- 不提交本地状态和构建产物；遵循各目录的 `.gitignore`。
- 提交前检查 staged diff，排除无关文件、生成物、调试输出和未说明的格式化。

## 文档维护

- 同目录下英文 `name.md` 与中文 `name.zh.md` 配对，首个标题下互链。优先引用同语言文档，避免正文混用语言。
- 两版含义一致，包含示例、约束和限制；标识、命令、数据路径和枚举不翻译。同步编辑、审阅，不用摘要替代译文。
- 用户指令优先。有差异时按实现与授权需求核对并修正两版，任何语言都不覆盖另一版。
- 仅 `SKILL.md` 保留可执行 frontmatter（`name`、`description`）；`SKILL.zh.md` 是阅读版，不重复注册。
- 根目录、`references/`、`docs/`、`examples/` 新增自有 Markdown 必须配对；新自有目录加入检查范围，依赖和生成输出除外。

## 检查与记录

```sh
node scripts/check-docs.mjs
```

检查配对、语言互链、本地 Markdown 链接和自确认后的变化。`docs/i18n.json` 保存将 CRLF 规范化为 LF 后的 SHA-256；哈希不能判断译文准确性。

核对两版后才更新记录，并与成对文件一起提交：

```sh
node scripts/check-docs.mjs --update
```

不要仅为消除报错刷新哈希。
