import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate } from '../scripts/validate.mjs';

const originalMap = JSON.parse(fs.readFileSync(new URL('../examples/architecture.json', import.meta.url), 'utf8'));
const originalEvents = fs.readFileSync(new URL('../examples/activity.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);

const constraintMap = JSON.parse(fs.readFileSync(new URL('../examples/system.architecture.json', import.meta.url), 'utf8'));
const constraintEvents = fs.readFileSync(new URL('../examples/harness.activity.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
test('constraint example is bilingual and legacy maps remain valid', () => {
  assert.equal(validate(constraintMap, constraintEvents, { requireBilingual: true }).ok, true);
  assert.equal(validate(originalMap, originalEvents).ok, true);
});
for (const [name, code, mutate] of [
  ['duplicate rules', 'constraint/duplicate', map => map.constraints.push(structuredClone(map.constraints[0]))],
  ['unknown targets', 'constraint/unknown-target', map => map.constraints[0].modules.push('missing')],
  ['mismatched scope', 'constraint/scope', map => { map.constraints[0].scope = 'project'; }],
  ['missing local evidence', 'constraint/source', map => { map.constraints[0].evidence = []; }],
  ['unconfirmed inference', 'constraint/inferred', map => { map.constraints[3].origin = 'inferred'; }],
  ['unresolved conflict reference', 'constraint/resolution', map => { map.constraints[0].applicability = 'conflict'; }],
  ['unknown resolution reference', 'constraint/reference', map => { Object.assign(map.constraints[0], { applicability: 'superseded', supersededBy: 'missing' }); }],
  ['supersession cycle', 'constraint/cycle', map => {
    Object.assign(map.constraints[0], { applicability: 'superseded', supersededBy: map.constraints[1].id });
    Object.assign(map.constraints[1], { applicability: 'superseded', supersededBy: map.constraints[0].id });
  }],
  ['unknown review', 'constraint/review-reference', (_, events) => { events[0].constraintReviews[0].constraintId = 'missing'; }],
  ['duplicate review', 'constraint/review-reference', (_, events) => events[0].constraintReviews.push(structuredClone(events[0].constraintReviews[0]))],
  ['review for another task', 'constraint/review-scope', map => { Object.assign(map.constraints[2], { scope: 'task', modules: [], taskId: 'another-task' }); }],
  ['review outside task scope', 'constraint/review-scope', map => { map.constraints[0].modules = ['workbench']; }],
  ['absent check', 'constraint/check-reference', (_, events) => { events[0].constraintReviews[0].checkIndexes = [3]; }],
  ['unsupported result', 'constraint/review-evidence', (_, events) => { events[0].constraintReviews[0].status = 'supported'; }],
  ['unexecuted check', 'constraint/test-evidence', (_, events) => {
    Object.assign(events[0].constraintReviews[0], { status: 'supported', evidence: 'Claimed support.', checkIndexes: [0] });
    events[0].checks = [{ command: 'node test.mjs', status: 'not-run', exitCode: null, summary: 'Pending.' }];
  }],
  ['mixed review and tests', 'constraint/review-method', (_, events) => { events[0].constraintReviews[1].checkIndexes = [0]; }]
]) test(`constraints reject ${name}`, () => {
  const map = structuredClone(constraintMap), events = structuredClone(constraintEvents);
  mutate(map, events);
  assert.ok(validate(map, events).errors.some(error => error.code === code));
});
test('test support requires passing checks and manual support remains distinct', () => {
  const events = structuredClone(constraintEvents);
  events[0].checks = [{ command: 'node test.mjs', status: 'passed', exitCode: 0, summary: 'Covered cancellation.' }];
  Object.assign(events[0].constraintReviews[0], { status: 'supported', evidence: 'Cancellation covered.', checkIndexes: [0] });
  Object.assign(events[0].constraintReviews[1], { status: 'supported', evidence: 'Reviewed recorded commands.' });
  assert.equal(validate(constraintMap, events).ok, true);
  events[0].checks[0].status = 'failed'; events[0].checks[0].exitCode = 1;
  assert.ok(validate(constraintMap, events).errors.some(error => error.code === 'constraint/test-evidence'));
});
test('constraint translations and evidence line ranges are validated', () => {
  const map = structuredClone(constraintMap);
  delete map.constraints[0].translations.en.verification;
  assert.ok(validate(map, [], { requireBilingual: true }).errors.some(error => error.code === 'translation/missing'));
  Object.assign(map.constraints[0].evidence[0], { line: 5, endLine: 2 });
  assert.ok(validate(map).errors.some(error => error.code === 'evidence/line-order'));
});
test('fictional end-to-end example conforms to both contracts', () => assert.equal(validate(originalMap, originalEvents).ok, true));

const cases = [
  ['duplicate identity', 'map/duplicate-id', (map) => { map.modules[1].id = 'web'; }],
  ['unknown relation', 'map/unknown-endpoint', (map) => { map.relationships[0].to = 'missing'; }],
  ['duplicate cell', 'map/occupied-cell', (map) => { map.modules[1].layout = map.modules[0].layout; }],
  ['uncertain without question', 'evidence/question-required', (map) => { map.modules[5].openQuestions = []; }],
  ['external ownership', 'map/external-ownership', (map) => { map.modules[5].ownership = [{ kind: 'directory', path: 'src' }]; }],
  ['stale revision', 'activity/map-mismatch', (map, events) => { events[0].mapRevision = map.revision + 1; }],
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

test('collaboration locks warn when agents overlap files or modules', () => {
  const events = structuredClone(originalEvents);
  events[0].collaboration = { agent: 'agent-a', locks: ['src/api/products.ts', 'api'] };
  events[1].collaboration = { agent: 'agent-b', locks: ['src/api/products.ts'] };
  const result = validate(originalMap, events);
  assert.ok(result.warnings.some((warning) => warning.code === 'collaboration/conflict'));
});

test('activity records accept timestamps and the source git commit', () => {
  const events = structuredClone(originalEvents);
  events[0].occurredAt = '2026-09-12T08:00:00Z';
  events[0].gitCommit = '39febad2439161900f70b8bf8ba7422daddfbc94';
  assert.equal(validate(originalMap, events).ok, true);
});

test('authoring requires explicit classifications while legacy maps remain valid', () => {
  const map = structuredClone(originalMap);
  map.modules.forEach(node => { delete node.role; });
  assert.equal(validate(map).ok, true);
  const result = validate(map, [], { requireRoles: true });
  assert.equal(result.errors.filter(error => error.code === 'role/required').length, map.modules.length);
  assert.equal(result.warnings[0].code, 'role/all-generic-review');
});

test('generic roles require reasons in authoring mode and insufficient evidence requires uncertainty', () => {
  const map = structuredClone(originalMap);
  map.modules.forEach(node => { node.role = 'generic'; });
  assert.equal(validate(map, [], { requireRoles: true }).ok, false);
  map.modules.forEach(node => { node.roleAssessment = { basis: 'out-of-taxonomy', note: 'Inspected responsibility does not fit a listed category.' }; });
  assert.equal(validate(map, [], { requireRoles: true }).ok, true);
  assert.equal(validate(map).warnings[0].code, 'role/all-generic-review');
  const node = map.modules[0];
  node.roleAssessment = { basis: 'insufficient-evidence', note: 'Implementation entry has not been established.' };
  node.status = 'supported';
  assert.ok(validate(map).errors.some(error => error.code === 'role/uncertainty-required'));
  node.status = 'uncertain';
  node.openQuestions = [];
  assert.ok(validate(map).errors.some(error => error.code === 'evidence/question-required'));
  node.openQuestions = ['Which entry implements this responsibility?'];
  assert.equal(validate(map, [], { requireRoles: true }).ok, true);
  node.roleAssessment.note = '  ';
  assert.equal(validate(map).ok, false);
  node.roleAssessment.note = 'Unresolved entry.';
  node.role = 'frontend';
  assert.ok(validate(map).errors.some(error => error.code === 'role/assessment-target'));
});

test('generic assessment translations are checked without translating classification enums', () => {
  const map = JSON.parse(fs.readFileSync(new URL('../examples/bilingual.architecture.json', import.meta.url)));
  const node = map.modules[0];
  node.role = 'generic';
  node.roleAssessment = { basis: 'out-of-taxonomy', note: 'Domain-specific responsibility.' };
  const locale = map.language === 'en' ? 'zh' : 'en';
  assert.ok(validate(map, [], { requireBilingual: true }).errors.some(error => error.location.includes('/roleAssessment/translations/')));
  node.roleAssessment.translations = { [locale]: { note: '领域专用职责。' } };
  assert.equal(validate(map, [], { requireBilingual: true }).ok, true);
  node.roleAssessment.translations[locale].name = 'Wrong field';
  assert.equal(validate(map).ok, false);
});

test('CLI authoring flag enforces roles and returns review warnings', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'birdview-roles-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'map.json');
  const map = structuredClone(originalMap);
  map.modules.forEach(node => { delete node.role; });
  fs.writeFileSync(file, JSON.stringify(map));
  const cli = fileURLToPath(new URL('../scripts/validate.mjs', import.meta.url));
  const legacy = spawnSync(process.execPath, [cli, file], { encoding: 'utf8' });
  assert.equal(legacy.status, 0);
  const strict = spawnSync(process.execPath, [cli, file, '--authoring'], { encoding: 'utf8' });
  assert.equal(strict.status, 1);
  assert.equal(JSON.parse(strict.stdout).warnings[0].code, 'role/all-generic-review');
});
