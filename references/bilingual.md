# Architecture language selection

[中文](bilingual.zh.md)

The HTML viewer translates controls locally. Project text must be authored by the
agent in the map; the browser does not call a translation API.

## Resolve language without asking

Honor explicit output-language instructions in the current request or an applicable
standing preference in the project conversation. Otherwise use the natural language
of the request that triggered the skill. Support any language, not a fixed menu.
For mixed-language requests, use the dominant prose language; code identifiers and
quoted source text do not decide it. For a language-neutral invocation, use the
recent user conversation language, then the existing map language, then English.
Do not ask the user to select or confirm a language, and do not pause generation
for language selection. Browser locale and saved UI settings do not override this.
Generate project names, responsibilities, relationship labels, evidence notes and
open questions in the resolved language while preserving proper names and code IDs.

For an existing map, reuse structure and preserve its base language and translations.
If the resolved delivery language is absent, add complete translations for it and
increment the revision under the map-update rules. If the map lacks `language`,
determine it from its authored prose; resolve ambiguous text using the delivery
language without asking. Do not remove existing translations unprompted.

- Chinese: set `language: "zh"`, write base text in Chinese, omit translations.
- English: set `language: "en"`, write base text in English, omit translations.
- Other single language: set its language tag (for example `ja`, `ko`, `fr`,
  `es`, `de`, `ar`, `pt-BR`), write base text in that language, omit translations.
- Multiple languages: use the user's preferred or first-listed language as base,
  and store each additional language under `translations.<language-tag>`.
  Preserve an existing base language when adding translations.

Validate single-language maps without `--bilingual`. The `--bilingual` check below
specifically checks Chinese and English; for other language combinations, verify
coverage of each selected language manually after structural validation.
Open the generated HTML with `#lang=<language-tag>` matching
the resolved delivery language so an old browser preference does not override delivery.
The viewer selector changes display language; it does not generate missing text.

## Author bilingual text

Inspect source once and describe the same architecture in both languages. Set
top-level `language` to the selected base language tag. Put other languages in
`translations.<language-tag>` on the object owning the text. For example:

```json
{
  "name": "Product API",
  "responsibility": "Query products and coordinate cache fallback.",
  "translations": {
    "zh": { "name": "商品 API", "responsibility": "查询商品，协调缓存回退。" }
  }
}
```

Translate project `name`, module `name` and `responsibility`, relationship `label`,
each evidence object's `note`, and nonempty `openQuestions`. Keep questions in
the same order and preserve uncertainty. Keep names short and responsibilities
concise for two lines; full text remains in details. Retain proper names like Redis.
Never translate IDs, paths, symbols, line numbers, enums or layout. Do not create
two maps or invent evidence while translating. The complete example is
`examples/bilingual.architecture.json` relative to the skill root.

```sh
node <skill-root>/scripts/validate.mjs <map.json> --bilingual
node <skill-root>/scripts/render.mjs <map.json> <architecture.html>
```

The strict check verifies text coverage and question counts, not translation
accuracy. Inspect both languages in the browser, including tooltips, details and
relationships. Legacy single-language maps remain valid without `--bilingual`;
missing translations fall back to the base text. Do not claim full bilingual
coverage until the strict check passes. Adding translations to a saved map requires
a revision increment under the usual map-update rules; respect active task bindings.

Initial language uses a supported `#lang=<language-tag>`, then a saved preference, then the
map's base language (Chinese for legacy maps). Switching preserves selection,
layout and zoom. Activity text uses optional event `translations[locale].reason`
and check `translations[locale].summary`, falling back to the original text.
Author these translations for every supported language in bilingual activity views;
the architecture `--bilingual` check does not check activity translation coverage.

Only Chinese and English UI controls are bundled; other locales use English
controls while displaying the selected project's authored text. Do not claim
the entire interface is translated into the selected language. Right-to-left
scripts can be used for content, but the graph layout and toolbar remain left-to-right.
