# Bilingual architecture authoring

The HTML viewer translates controls locally. Project text must be authored by the
agent in the map; the browser does not call a translation API.

For new maps, default to Chinese and English unless the user requests one language.
Inspect source once and describe the same architecture in both languages. Set
top-level `language` to `zh` or `en` for the base string fields. Put the other
language in `translations.zh` or `translations.en` on the object owning the text:

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

Initial language uses `#lang=zh` or `#lang=en`, then a saved preference, then the
map's base language (Chinese for legacy maps). Switching preserves selection,
layout and zoom. This covers architecture text; activity records and the separate
simulated playback template are unchanged.
