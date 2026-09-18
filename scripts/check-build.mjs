import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'birdview-build-'));
try {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', path.join(root, 'tsconfig.json'), '--outDir', output], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('TypeScript build failed.');
  for (const file of fs.readdirSync(output, { recursive: true })) {
    if (!fs.statSync(path.join(output, file)).isFile()) continue;
    const target = path.join(root, 'scripts', file);
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== fs.readFileSync(path.join(output, file), 'utf8')) {
      throw new Error(`Generated scripts/${file} is stale. Run npm run build.`);
    }
  }
  console.log('TypeScript output matches distributed JavaScript.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
