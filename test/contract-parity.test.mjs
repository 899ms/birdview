import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { checkArchitecture, checkActivity } from '../scripts/contracts/parse.mjs';

const read = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const old = new Ajv2020({ allErrors: true, strict: true, formats: { 'date-time': true } });
old.addSchema(read('./fixtures/contracts-v1/architecture.schema.json'));
const oldMap = old.getSchema('urn:birdview:architecture:1');
const oldEvent = old.compile(read('./fixtures/contracts-v1/activity.schema.json'));
const generated = new Ajv2020({ allErrors: true, strict: true, formats: { 'date-time': true } });
generated.addSchema(read('../schemas/architecture.schema.json'));
const generatedMap = generated.getSchema('urn:birdview:architecture:1');
const generatedEvent = generated.compile(read('../schemas/activity.schema.json'));

function* mutations(value, path = []) {
  yield [path, null];
  yield [path, ''];
  yield [path, 'unknown-value'];
  yield [path, -1];
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      yield [path, []];
      if (value.length) yield [path, [value[0], value[0]]];
    } else {
      yield [path, { ...value, unexpectedField: true }];
      for (const key of Object.keys(value)) {
        const copy = { ...value };
        delete copy[key];
        yield [path, copy];
      }
    }
    for (const [key, item] of Object.entries(value)) yield* mutations(item, [...path, key]);
  }
}

test('typed runtime and exported schemas preserve v1 acceptance without mutating inputs', () => {
  const maps = ['architecture', 'bilingual.architecture', 'system.architecture'].map(name => read(`../examples/${name}.json`));
  const events = ['activity.jsonl', 'harness.activity.jsonl'].flatMap(name => fs.readFileSync(new URL(`../examples/${name}`, import.meta.url), 'utf8').trim().split(/\r?\n/).map(JSON.parse));
  let compared = 0;
  for (const [fixtures, previous, current, exchange] of [[maps, oldMap, checkArchitecture, generatedMap], [events, oldEvent, checkActivity, generatedEvent]]) {
    for (const original of fixtures) {
      assert.equal(previous(original), true);
      for (const [path, replacement] of [[[], original], ...mutations(original)]) {
        let input = structuredClone(original);
        if (!path.length) input = structuredClone(replacement);
        else {
          let parent = input;
          for (const key of path.slice(0, -1)) parent = parent[key];
          parent[path.at(-1)] = structuredClone(replacement);
        }
        const before = structuredClone(input);
        const expected = previous(input);
        assert.equal(current(input), expected, `runtime parity at ${path.join('/')}`);
        assert.equal(exchange(input), expected, `export parity at ${path.join('/')}`);
        assert.deepEqual(input, before, 'validation must not coerce or strip input');
        compared++;
      }
    }
  }
  assert.ok(compared > 1000);
});

test('legacy schema anchors remain available to external references', () => {
  for (const name of Object.keys(read('./fixtures/contracts-v1/architecture.schema.json').$defs)) {
    assert.ok(generated.getSchema(`urn:birdview:architecture:1#/$defs/${name}`));
  }
  assert.ok(generated.getSchema('urn:birdview:activity:1#/$defs/paths'));
});
