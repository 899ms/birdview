import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderArchitecture } from '../scripts/render.mjs';

const example = JSON.parse(fs.readFileSync(new URL('../examples/architecture.json', import.meta.url), 'utf8'));
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
