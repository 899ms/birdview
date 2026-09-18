import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderArchitecture } from '../scripts/render.mjs';
const { chromium } = await import(process.env.BIRDVIEW_PLAYWRIGHT_PATH ? pathToFileURL(process.env.BIRDVIEW_PLAYWRIGHT_PATH).href : 'playwright');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'birdview-guide-'));
const map = JSON.parse(fs.readFileSync(new URL('../examples/system.architecture.json', import.meta.url)));
const events = fs.readFileSync(new URL('../examples/harness.activity.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const file = path.join(dir, 'guide.html');
  fs.writeFileSync(file, renderArchitecture(map, events));
  await page.goto(pathToFileURL(file).href + '#lang=zh');
  await page.locator('#actual').click();
  const state = () => page.evaluate(() => ({ mode: document.querySelector('[data-view][aria-pressed="true"]')?.getAttribute('data-view'), index: document.getElementById('activity-step').value, selected: document.querySelector('#map .node.selected')?.getAttribute('data-module'), zoom: document.getElementById('map').style.transform, fitting: document.getElementById('fit').getAttribute('aria-pressed'), inspector: document.querySelector('.workspace').classList.contains('inspector-open'), disclosure: document.getElementById('activity-disclosure').open }));
  const before = await state();
  await page.locator('#guide-launch').click();
  assert.match(await page.locator('#guide-count').textContent(), /1 \/ 5/);
  for (let i = 0; i < 5; i++) {
    const box = await page.locator('#guide-card').boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1441 && box.y + box.height <= 901);
    await page.locator('#guide-next').click();
  }
  assert.deepEqual(await state(), before);
  await page.locator('#guide-launch').click();
  await page.locator('#guide-next').click();
  await page.keyboard.press('Escape');
  assert.deepEqual(await state(), before);
  assert.equal(await page.locator('#guide-launch').evaluate(el => el === document.activeElement), true);
  await page.reload();
  assert.equal(await page.locator('#guide-invite').isVisible(), false);
  await page.locator('#language').selectOption('en');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#guide-launch').click();
  for (let i = 0; i < 5; i++) {
    const box = await page.locator('#guide-card').boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 391 && box.y + box.height <= 845);
    assert.match(await page.locator('#guide-count').textContent(), /Step/);
    await page.locator('#guide-next').click();
  }
  fs.writeFileSync(file, renderArchitecture(map));
  await page.reload();
  await page.locator('#guide-launch').click();
  assert.match(await page.locator('#guide-count').textContent(), /1 of 2/);
  await page.locator('#guide-next').click();
  await page.locator('#guide-skip').click();
  assert.equal(await page.locator('#guide-dialog').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('Guide: 5/2 steps, Chinese/English, desktop/mobile, completion/Escape, state/focus restoration and persistent dismissal passed.');
} finally {
  await browser.close();
  fs.rmSync(dir, { recursive: true, force: true });
}
