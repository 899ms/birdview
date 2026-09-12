import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { renderArchitecture } from '../scripts/render.mjs';
import { validate } from '../scripts/validate.mjs';

const example = JSON.parse(fs.readFileSync(new URL('../examples/architecture.json', import.meta.url), 'utf8'));
const bilingual = JSON.parse(fs.readFileSync(new URL('../examples/bilingual.architecture.json', import.meta.url), 'utf8'));
test('activity rendering validates binding and transitions before delivery', () => {
  const map = JSON.parse(fs.readFileSync(new URL('../examples/system.architecture.json', import.meta.url), 'utf8'));
  const events = fs.readFileSync(new URL('../examples/harness.activity.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
  const html = renderArchitecture(map, events, { simulation: true });
  assert.ok(html.includes('tool-timeout'));
  assert.ok(html.includes('"simulation":true'));
  assert.ok(!html.includes('/* BIRDVIEW_'));
  assert.match(html, /<link rel="icon" type="image\/png" href="data:image\/png;base64,/);
  assert.match(html, /"brandLogo":"data:image\/png;base64,/);
  assert.ok(html.includes(fs.readFileSync(new URL('../LICENSE', import.meta.url), 'utf8')));
  assert.ok(html.includes(fs.readFileSync(new URL('../THIRD_PARTY_NOTICES', import.meta.url), 'utf8')));
  const wrong = structuredClone(events);
  wrong[0].mapRevision++;
  assert.throws(() => renderArchitecture(map, wrong), /map-mismatch/);
  const unordered = structuredClone(events);
  unordered[1].sequence = 9;
  assert.throws(() => renderArchitecture(map, unordered), /sequence/);
});
test('relationships require explicit semantics and visibility; reject retired fields', () => {
  const map = structuredClone(example);
  for (const kind of ['request', 'result', 'dependency', 'event', 'control']) {
    for (const visibility of ['overview', 'detail']) {
      Object.assign(map.relationships[0], { kind, visibility });
      assert.equal(validate(map).ok, true);
    }
  }
  map.relationships[0].primary = true;
  assert.equal(validate(map).ok, false);
  delete map.relationships[0].primary;
  delete map.relationships[0].visibility;
  assert.equal(validate(map).ok, false);
  map.relationships[0].visibility = 'overview';
  delete map.relationships[0].kind;
  assert.equal(validate(map).ok, false);
});
const routeArchitecture = vm.runInNewContext(fs.readFileSync(new URL('../assets/architecture-routing.js', import.meta.url), 'utf8') + '\nrouteArchitecture');
test('routes avoid intervening cards and spread shared ports, including reverse and self edges', () => {
  const positions = new Map([['a',{x:28,y:30}],['blocker',{x:232,y:30}],['b',{x:436,y:30}],['c',{x:232,y:158}]]);
  const relations = [{from:'a',to:'b'},{from:'a',to:'c'},{from:'b',to:'a'},{from:'c',to:'c'}];
  const routes = routeArchitecture(relations, positions);
  assert.notDeepEqual(routes[0].points[0],routes[1].points[0]);
  routes.forEach((route,index) => {
    assert.ok(!/NaN|Infinity/.test(route.d));
    assert.ok(route.points.length >= 2);
    for (let i=1;i<route.points.length;i++) {
      const a=route.points[i-1],b=route.points[i];
      assert.ok(a[0]===b[0] || a[1]===b[1]);
      for (const [id,p] of positions) {
        const intersects = a[0]===b[0]
          ? a[0]>p.x && a[0]<p.x+164 && Math.max(a[1],b[1])>p.y && Math.min(a[1],b[1])<p.y+72
          : a[1]>p.y && a[1]<p.y+72 && Math.max(a[0],b[0])>p.x && Math.min(a[0],b[0])<p.x+164;
        assert.equal(intersects,false,`route ${index} crosses ${id}`);
      }
    }
  });
  assert.ok(routes[0].points.some(p=>p[1]<30 || p[1]>102));
});
test('diagonal neighbors use a single turn when the corridor is empty', () => {
  const positions = new Map([['a',{x:28,y:30}],['b',{x:232,y:158}]]);
  const [route] = routeArchitecture([{from:'a',to:'b'}], positions);
  assert.equal(route.points.length, 3);
  assert.equal(route.points[0][1], 102);
  assert.equal(route.points.at(-1)[0], 232);
});

test('module roles accept supported values and reject invented categories', () => {
  const map = structuredClone(example);
  assert.equal(validate(map).ok, true);
  for (const role of ['frontend', 'backend', 'cache', 'database', 'queue', 'security', 'generic']) {
    map.modules[0].role = role;
    assert.equal(validate(map).ok, true);
  }
  map.modules[0].role = 'random-purple';
  assert.equal(validate(map).ok, false);
});
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
test('group roles allow explicit semantics and preserve unclassified maps', () => {
  const map = JSON.parse(fs.readFileSync(new URL('../examples/system.architecture.json', import.meta.url), 'utf8'));
  for (const role of ['interaction', 'runtime', 'external-services', 'generic']) {
    map.groups[0].role = role;
    assert.equal(validate(map).ok, true);
  }
  delete map.groups[0].role;
  assert.equal(validate(map).ok, true);
  map.groups[0].role = 'invented';
  assert.equal(validate(map).ok, false);
});

test('groups reject unknown, overlapping and duplicate membership identities', () => {
  const map = structuredClone(example);
  map.groups = [{ id: 'app', name: 'Application', members: ['web'], evidence: [{ path: 'docs/system.md', note: 'Example membership.' }] }];
  assert.equal(validate(map).ok, true);
  map.groups.push(structuredClone(map.groups[0]));
  assert.ok(validate(map).errors.some((error) => error.code === 'group/overlap'));
  assert.ok(validate(map).errors.some((error) => error.code === 'group/duplicate-id'));
  map.groups[1].members = ['unknown'];
  assert.ok(validate(map).errors.some((error) => error.code === 'group/unknown-member'));
});
test('language tags support non-English base text and additional translations', () => {
  const map = structuredClone(example);
  map.language = 'ja';
  map.project.name = '商品システム';
  map.project.translations = { 'pt-BR': { name: 'Sistema de produtos' } };
  assert.equal(validate(map).ok, true);
  assert.ok(renderArchitecture(map).includes('商品システム'));
  map.language = '../../invalid';
  assert.equal(validate(map).ok, false);
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
