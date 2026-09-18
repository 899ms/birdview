import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { availableLanguages, selectLanguage, isChinese, translate, localized, uiTranslations } from '../scripts/viewer/i18n.mjs';

test('language selection preserves discovery order and URL/storage/base precedence', () => {
  const map = {language:'fr',project:{translations:{fr:{name:'Projet'}}},modules:[{translations:{de:{}},evidence:[{translations:{ja:{}}}]}],relationships:[],groups:[{translations:{es:{}}}],constraints:[{translations:{ko:{}}}]};
  const available = availableLanguages(map);
  assert.deepEqual([...available], ['fr','zh','en','de','ja','es','ko']);
  assert.equal(selectLanguage('fr',available,'de','ja'),'ja');
  assert.equal(selectLanguage('fr',available,'de','invalid'),'de');
  assert.equal(selectLanguage('fr',available,'invalid',null),'fr');
  assert.equal(selectLanguage(undefined,new Set(['zh','en']),null,null),'zh');
  assert.equal(isChinese('zh-Hant'),true);
  assert.equal(isChinese('en'),false);
});

test('localized values retain exact fallback, arrays and all existing UI strings', () => {
  for (const [source, english] of Object.entries(uiTranslations)) {
    assert.equal(translate(source,'zh'),source);
    assert.equal(translate(source,'zh-Hant'),source);
    assert.equal(translate(source,'en'),english);
    assert.equal(translate(source,'fr'),english);
  }
  assert.equal(translate('unknown label','en'),'unknown label');
  const item = {name:'Base',openQuestions:['base question'], translations:{en:{name:'English',openQuestions:['question']},fr:{name:''}}};
  assert.equal(localized(item,'name','en'),'English');
  assert.equal(localized(item,'name','de'),'Base');
  assert.equal(localized(item,'name','fr'),'');
  assert.deepEqual(localized(item,'openQuestions','en'),['question']);
  assert.equal(localized({},'name','en'),'');
  assert.deepEqual(localized(item,'openQuestions','de'),['base question']);
});

test('translations match pre-migration examples and catalog', () => {
  const source = fs.readFileSync(new URL('./fixtures/i18n-v1.js', import.meta.url),'utf8');
  const oldCatalog = vm.runInNewContext(source.slice(0,source.indexOf('const availableLanguages'))+'\nuiTranslations');
  assert.deepEqual(uiTranslations,structuredClone(oldCatalog));
  for (const file of ['architecture.json','system.architecture.json','bilingual.architecture.json']) {
    const map = JSON.parse(fs.readFileSync(new URL(`../examples/${file}`,import.meta.url),'utf8'));
    const old = vm.runInNewContext(source.slice(source.indexOf('const availableLanguages'),source.indexOf('let language'))+'\n[...availableLanguages]',{map});
    assert.deepEqual([...availableLanguages(map)],structuredClone(old));
    for (const item of [map.project,...map.modules,...map.relationships,...(map.groups||[]),...(map.constraints||[])]) {
      for (const language of availableLanguages(map)) for (const field of ['name','responsibility','label','note','verification','openQuestions']) {
        assert.deepEqual(localized(item,field,language),item.translations?.[language]?.[field] ?? item[field] ?? '');
      }
    }
  }
});
