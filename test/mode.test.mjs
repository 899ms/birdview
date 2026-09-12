import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../scripts/birdview.mjs', import.meta.url));
function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'birdview-mode-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function run(root, ...args) {
  return spawnSync(process.execPath, [cli, 'mode', ...args, '--project', root], { encoding: 'utf8' });
}

test('default mode is read-only; explicit selection creates a project rule', (t) => {
  const root = project(t);
  assert.match(run(root).stdout, /auto.*default/);
  assert.equal(fs.existsSync(path.join(root, 'AGENTS.md')), false);
  assert.equal(run(root, 'auto').status, 0);
  assert.match(run(root).stdout, /^auto\n/);
});

test('switching preserves surrounding UTF-8 text, BOM and CRLF; repeat is idempotent', (t) => {
  const root = project(t);
  const file = path.join(root, 'AGENTS.md');
  const prefix = '\uFEFF# 用户规则\r\n不得覆盖。\r\n';
  fs.writeFileSync(file, prefix);
  assert.equal(run(root, 'auto').status, 0);
  const automatic = fs.readFileSync(file, 'utf8');
  assert.ok(automatic.startsWith(prefix));
  assert.equal(automatic.replaceAll('\r\n', '').includes('\n'), false);
  fs.appendFileSync(file, '\r\n其他规则保持原样。');
  assert.equal(run(root, 'on-demand').status, 0);
  const manual = fs.readFileSync(file, 'utf8');
  assert.ok(manual.startsWith(prefix));
  assert.ok(manual.endsWith('\r\n其他规则保持原样。'));
  assert.match(run(root).stdout, /^on-demand\n/);
  assert.equal(run(root, 'on-demand').status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), manual);
  assert.equal(manual.split('<!-- birdview:mode:start -->').length, 2);
  const local = spawnSync(process.execPath, [cli, 'mode'], { cwd: root, encoding: 'utf8' });
  assert.equal(local.status, 0);
  assert.match(local.stdout, /^on-demand\n/);
});

test('malformed, duplicate blocks and invalid arguments fail without writing', (t) => {
  const root = project(t);
  const file = path.join(root, 'AGENTS.md');
  for (const original of ['user\n<!-- birdview:mode:start -->', '<!-- birdview:mode:end -->\n<!-- birdview:mode:start -->', '<!-- birdview:mode:start -->\nunknown\n<!-- birdview:mode:end -->']) {
    fs.writeFileSync(file, original);
    assert.equal(run(root, 'auto').status, 1);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
  }
  fs.writeFileSync(file, 'keep');
  assert.equal(run(root, 'invalid').status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), 'keep');
  assert.equal(run(root, 'auto').status, 0);
  const duplicate = fs.readFileSync(file, 'utf8').repeat(2);
  fs.writeFileSync(file, duplicate);
  assert.equal(run(root, 'on-demand').status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), duplicate);
  fs.unlinkSync(file);
  fs.mkdirSync(file);
  assert.equal(run(root, 'auto').status, 1);
  assert.ok(fs.statSync(file).isDirectory());
});
