import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('documentation checker detects drift and invalid records without overwriting them', t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'birdview-docs-test-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const directory of ['scripts', 'references', 'docs', 'examples', '.github']) {
    fs.mkdirSync(path.join(fixture, directory));
  }
  const checker = path.join(fixture, 'scripts/check-docs.mjs');
  fs.copyFileSync(path.join(root, 'scripts/check-docs.mjs'), checker);
  fs.writeFileSync(path.join(fixture, 'README.md'), '# Example\n\n[中文](README.zh.md)\n');
  fs.writeFileSync(path.join(fixture, 'README.zh.md'), '# 示例\n\n[English](README.md)\n');
  const run = (...args: string[]) => spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(run('--update').status, 0);
  assert.equal(run().status, 0);
  const record = path.join(fixture, 'docs/i18n.json');
  const saved = fs.readFileSync(record, 'utf8');
  fs.appendFileSync(path.join(fixture, 'README.md'), '\nChanged\n');
  const drift = run();
  assert.equal(drift.status, 1);
  assert.match(drift.stderr, /README.md: synchronization confirmation required/);
  assert.equal(fs.readFileSync(record, 'utf8'), saved);
  for (const invalid of ['null', '[]', '"not a record"']) {
    fs.writeFileSync(record, invalid);
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Documentation hash record must be an object/);
    assert.equal(fs.readFileSync(record, 'utf8'), invalid);
  }
});

test('build checker compares fresh compiler output and detects missing or stale artifacts', t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'birdview-build-test-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const directory of ['src', 'scripts/contracts', 'node_modules/typescript/bin']) {
    fs.mkdirSync(path.join(fixture, directory), { recursive: true });
  }
  const checker = path.join(fixture, 'scripts/check-build.mjs');
  fs.copyFileSync(path.join(root, 'scripts/check-build.mjs'), checker);
  // Use the real compiler with a tiny project; only the unrelated schema export is inert.
  const compiler = pathToFileURL(path.join(root, 'node_modules/typescript/bin/tsc')).href;
  fs.writeFileSync(path.join(fixture, 'node_modules/typescript/bin/tsc'), `import(${JSON.stringify(compiler)});\n`);
  fs.writeFileSync(path.join(fixture, 'scripts/contracts/export.mjs'), '');
  fs.writeFileSync(path.join(fixture, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { module: 'NodeNext', target: 'ES2022', rootDir: 'src', outDir: 'scripts', types: [], newLine: 'lf' },
    include: ['src/*.mts'],
  }));
  fs.writeFileSync(path.join(fixture, 'src/example.mts'), 'export const value: number = 1;\n');
  const initial = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', path.join(fixture, 'tsconfig.json')], { encoding: 'utf8' });
  assert.equal(initial.status, 0, initial.stdout + initial.stderr);
  const run = () => spawnSync(process.execPath, [checker], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(run().status, 0);
  const artifact = path.join(fixture, 'scripts/example.mjs');
  fs.writeFileSync(artifact, 'export const value = 2;\n');
  const stale = run();
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Generated scripts\/example.mjs is stale/);
  fs.unlinkSync(artifact);
  const missing = run();
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Generated scripts\/example.mjs is stale/);
});
