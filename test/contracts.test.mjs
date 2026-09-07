import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validate } from '../scripts/validate.mjs';

const originalMap = JSON.parse(fs.readFileSync(new URL('../examples/architecture.json', import.meta.url), 'utf8'));
const originalEvents = fs.readFileSync(new URL('../examples/activity.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
test('fictional end-to-end example conforms to both contracts', () => assert.equal(validate(originalMap, originalEvents).ok, true));

const cases = [
  ['duplicate identity', 'map/duplicate-id', (map) => { map.modules[1].id = 'web'; }],
  ['unknown relation', 'map/unknown-endpoint', (map) => { map.relationships[0].to = 'missing'; }],
  ['duplicate cell', 'map/occupied-cell', (map) => { map.modules[1].layout = map.modules[0].layout; }],
  ['uncertain without question', 'evidence/question-required', (map) => { map.modules[5].openQuestions = []; }],
  ['external ownership', 'map/external-ownership', (map) => { map.modules[5].ownership = [{ kind: 'directory', path: 'src' }]; }],
  ['stale revision', 'activity/map-mismatch', (_, events) => { events[0].mapRevision = 2; }],
  ['out-of-order event', 'activity/sequence', (_, events) => { events[1].sequence = 9; }],
  ['unannounced expansion', 'activity/scope-change', (_, events) => { events[1].scope.push('storage'); }],
  ['file outside target', 'activity/file-target', (_, events) => { events[1].files = ['src/storage/products.ts']; }],
  ['false mapping', 'activity/unmapped-files', (_, events) => { events[1].files = ['src/api-other/a.ts']; }],
  ['contradictory check', 'activity/check-result', (_, events) => { events[4].checks[0].exitCode = 1; }],
  ['closed task', 'activity/closed-task', (_, events) => { events.push({ ...events[0], sequence: 6 }); }],
  ['unknown property', 'schema/architecture', (map) => { map.guessed = true; }],
];
for (const [name, code, mutate] of cases) test(`rejects ${name}`, () => {
  const map = structuredClone(originalMap);
  const events = structuredClone(originalEvents);
  mutate(map, events);
  assert.ok(validate(map, events).errors.some((error) => error.code === code));
});
for (const badPath of ['../secret', '/private', 'C:/private', 'src//file', 'src/./file', 'src/../file', '.git/config', 'src\\file', 'src/']) test(`rejects unsafe path ${badPath}`, () => {
  const map = structuredClone(originalMap);
  map.modules[0].ownership[0].path = badPath;
  assert.equal(validate(map).ok, false);
});
test('explicit replanning permits expanded scope and a later new task', () => {
  const events = structuredClone(originalEvents);
  events.splice(1, 0, { ...events[0], scope: ['api', 'cache', 'storage'], reason: 'Add storage to the declared plan.' });
  events.slice(2).forEach((event) => { event.scope = ['api', 'cache', 'storage']; });
  events.push({ ...events[0], taskId: 'second-task' });
  events.forEach((event, index) => { event.sequence = index + 1; });
  assert.equal(validate(originalMap, events).ok, true);
});
