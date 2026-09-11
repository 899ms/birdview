import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderArchitecture } from '../scripts/render.mjs';

const { chromium } = await import(process.env.BIRDVIEW_PLAYWRIGHT_PATH ? pathToFileURL(process.env.BIRDVIEW_PLAYWRIGHT_PATH).href : 'playwright');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'birdview-viewport-'));
const map = JSON.parse(fs.readFileSync(new URL('../examples/system.architecture.json', import.meta.url)));
const events = fs.readFileSync(new URL('../examples/harness.activity.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const file = path.join(dir, 'viewer.html');
  fs.writeFileSync(file, renderArchitecture(map, events, { simulation: true }));
  for (const [width, height] of [[1440, 900], [1024, 768], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(pathToFileURL(file).href + '#lang=zh');
    await page.locator('#show-details').click();
    await page.evaluate(() => { document.getElementById('evidence').textContent = 'Long evidence\n'.repeat(100); });
    for (const mode of ['activity', 'compare', 'architecture']) {
      await page.locator(`[data-view="${mode}"]`).click();
      if (mode !== 'architecture') await page.locator('#activity-disclosure').evaluate(el => { el.open = true; });
      const result = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        aside.scrollTop = 100;
        const view = document.getElementById('map-stage').parentElement;
        return { page: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, asideScroll: aside.scrollTop, mapHeight: view.clientHeight, bottom: aside.getBoundingClientRect().bottom };
      });
      assert.ok(result.page <= height + 1 && result.width <= width + 1, JSON.stringify(result));
      assert.ok(result.asideScroll > 0 && result.bottom <= height && result.mapHeight > 40, JSON.stringify(result));
    }
    await page.locator('#close-details').click();
    assert.equal(await page.locator('aside').isVisible(), false);
  }
  console.log('Viewport checks passed: desktop/tablet/mobile, all views, long evidence and expanded activity details.');
} finally {
  await browser.close();
  fs.rmSync(dir, { recursive: true, force: true });
}
