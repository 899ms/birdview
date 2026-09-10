# 架构语言选择

[English](bilingual.md)

HTML 查看器在本地翻译控件。项目文本必须由 Agent 写入地图，浏览器不调用翻译 API。

## 不询问，直接确定语言

遵循当前请求明确的输出语言要求，或项目对话中适用的持续偏好；否则使用触发技能请求的自然语言。支持任意语言，不限固定菜单。混合语言请求以主要叙述语言为准，代码标识和引用源码不决定语言。无自然语言的调用依次使用近期用户对话语言、现有地图语言、英文。
不要要求用户选择或确认语言，不要为语言选择暂停生成。浏览器语言和已存 UI 设置不能覆盖此规则。项目名称、职责、关系标签、证据说明和待确认问题使用确定的语言，保留专有名称与代码 ID。

现有地图应复用结构，保留基础语言及翻译。若缺少交付语言，为其补齐完整翻译，并按更新规则增加版本。地图没有 `language` 时，从现有正文判断；有歧义时直接采用交付语言，不询问。不要擅自删除已有翻译。

- 中文：设置 `language: "zh"`，基础文本写中文，省略翻译。
- 英文：设置 `language: "en"`，基础文本写英文，省略翻译。
- 其他单语言：设置对应标签（例如 `ja`、`ko`、`fr`、`es`、`de`、`ar`、`pt-BR`），用该语言写基础文本，省略翻译。
- 多语言：以用户偏好或首列语言为基础，其他语言存入 `translations.<language-tag>`。增加翻译时保留现有基础语言。

单语言地图校验不加 `--bilingual`。下述检查专用于中文和英文；其他语言组合在结构校验后，手动核对各语言覆盖。打开生成 HTML 时添加 `#lang=<language-tag>`，匹配交付语言，避免旧浏览器偏好覆盖。选择器只改变显示语言，不会生成缺失文本。

## 编写双语文本

源码只检查一次，用两种语言描述同一架构。顶层 `language` 设置基础语言标签，其他语言放在文本所属对象的 `translations.<language-tag>` 中。例如：

```json
{
  "name": "Product API",
  "responsibility": "Query products and coordinate cache fallback.",
  "translations": {
    "zh": { "name": "商品 API", "responsibility": "查询商品，协调缓存回退。" }
  }
}
```

翻译项目 `name`、模块 `name` 与 `responsibility`、关系 `label`、每个证据对象的 `note`，以及非空 `openQuestions`。问题顺序与不确定性必须保留。名称简短，职责适合两行展示，完整文本仍可在详情读取。保留 Redis 等专有名称。
不要翻译 ID、路径、符号、行号、枚举或布局。不要创建两张地图，也不要在翻译时编造证据。完整示例位于技能根目录的 `examples/bilingual.architecture.json`。

```sh
node <skill-root>/scripts/validate.mjs <map.json> --bilingual
node <skill-root>/scripts/render.mjs <map.json> <architecture.html>
```

严格检查验证文本覆盖与问题数量，不验证翻译准确性。浏览器中检查两种语言，包括提示、详情和关系。不加 `--bilingual` 时旧单语言地图仍有效，缺失翻译回退基础文本。严格检查通过前不能声称完整双语覆盖。为已保存地图增加翻译也要按通常规则增加版本，并遵守活动任务绑定。

初始语言依次采用支持的 `#lang=<language-tag>`、已存偏好、地图基础语言（旧地图默认中文）。切换保留选择、布局和缩放。活动文本使用可选事件 `translations[locale].reason` 和检查 `translations[locale].summary`，缺失时回退原文。双语活动视图应为每种支持语言编写这些翻译；架构 `--bilingual` 检查不校验活动翻译覆盖。

控件仅内置中文和英文；其他语言使用英文控件，同时显示所选项目语言的文本。不要声称整个界面都已翻译成所选语言。内容支持从右向左书写的文字，但图布局和工具栏仍从左向右排列。
