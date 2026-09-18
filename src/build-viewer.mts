import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Source: src/build-viewer.mts. Regenerate scripts/build-viewer.mjs with npm run build.
const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.slice(2).includes('--check');
try {
  for (const format of ['esm', 'iife'] as const) {
    const target = format === 'esm' ? 'scripts/viewer/routing.mjs' : 'assets/architecture-routing.js';
    const result = await build({
      absWorkingDir: root,
      entryPoints: ['src/viewer/routing.mts'],
      bundle: true,
      format,
      ...(format === 'iife' ? { globalName: 'BirdviewRouting' } : {}),
      platform: 'browser',
      target: 'es2022',
      write: false,
      banner: { js: '// Generated from src/viewer/routing.mts. Do not edit directly.' },
    });
    const output = result.outputFiles[0];
    if (!output) throw new Error(`No browser output for ${target}.`);
    const file = path.join(root, target);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== output.text) {
        throw new Error(`Generated ${target} is stale. Run npm run build.`);
      }
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, output.text);
    }
  }
  console.log(check ? 'Browser artifacts match TypeScript sources.' : 'Built browser routing artifacts.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
