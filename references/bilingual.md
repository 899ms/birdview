# Architecture language selection

The HTML viewer translates controls locally. Project text must be authored by the
agent in the map; the browser does not call a translation API.

## Choose before generating

After checking for an existing map, establish the output language before writing
a new map or translating its text. Honor an explicit choice already made in the
current request or project conversation without asking again. Otherwise ask once:
"Which language should this architecture use? You may name one or more languages."
Accept any named language, such as Chinese, English, Japanese, Korean, French,
Spanish, German, Arabic or Portuguese. Do not constrain the answer to a fixed menu.
Generate the project name, module names and responsibilities, relationships,
evidence notes and open questions directly in the selected language. Do not infer
the choice from the chat language, browser locale or UI preference. Wait for an
answer before generating the architecture text; source inspection may continue.

For an existing map, preserve its established language and translations by default.
If a legacy map lacks `language` and its output language cannot be determined,
ask before rewriting its text. Do not remove existing translations unprompted.

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
the chosen base language so an old browser preference does not override delivery.
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
layout and zoom. This covers architecture text; activity records and the separate
simulated playback template are unchanged.

Only Chinese and English UI controls are bundled; other locales use English
controls while displaying the selected project's authored text. Do not claim
the entire interface is translated into the selected language. Right-to-left
scripts can be used for content, but the graph layout and toolbar remain left-to-right.
