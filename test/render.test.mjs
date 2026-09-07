import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderArchitecture } from '../scripts/render.mjs';
import { validate } from '../scripts/validate.mjs';

const example = JSON.parse(fs.readFileSync(new URL('../examples/architecture.json', import.meta.url), 'utf8'));
const bilingual = JSON.parse(fs.readFileSync(new URL('../examples/bilingual.architecture.json', import.meta.url), 'utf8'));
test('bilingual example passes strict coverage; legacy remains compatible', () => {
  assert.equal(validate(bilingual, [], { requireBilingual: true }).ok, true);
  assert.equal(validate(example).ok, true);
  assert.equal(validate(example, [], { requireBilingual: true }).ok, false);
});
test('strict coverage detects missing evidence translation', () => {
  const map = structuredClone(bilingual);
  delete map.modules[0].evidence[0].translations;
  assert.ok(validate(map, [], { requireBilingual: true }).errors.some((error) => error.code === 'translation/missing'));
});
test('translations cannot alter structure or omit open questions', () => {
  const map = structuredClone(bilingual);
  map.modules[0].translations.zh.id = 'translated-id';
  assert.equal(validate(map).ok, false);
  delete map.modules[0].translations.zh.id;
  map.modules[1].translations.zh.openQuestions = [];
  assert.ok(validate(map).errors.some((error) => error.code === 'translation/questions'));
});
test('renderer rejects invalid maps before generating HTML', () => {
  const map = structuredClone(example);
  map.relationships[0].to = 'missing';
  assert.throws(() => renderArchitecture(map), /unknown-endpoint/);
});
test('renderer embeds project data without allowing script termination', () => {
  const map = structuredClone(example);
  map.project.name = '</script><script>globalThis.injected=true</script>';
  const html = renderArchitecture(map);
  assert.ok(!html.includes(map.project.name));
  assert.ok(html.includes('\\u003c/script>'));
  assert.ok(html.includes('const DATA = '));
  assert.ok(!html.includes('/* BIRDVIEW_'));
});
