# 贡献指南

[English](CONTRIBUTING.md)

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
