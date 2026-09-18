import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Source: src/build-viewer.mts. Regenerate scripts/build-viewer.mjs with npm run build.
const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.slice(2).includes('--check');
try {
  for (const module of ['routing', 'i18n'] as const) for (const format of ['esm', 'iife'] as const) {
    const target = format === 'esm' ? `scripts/viewer/${module}.mjs` : module === 'routing' ? 'assets/architecture-routing.js' : 'assets/architecture-i18n-core.js';
    const result = await build({
      absWorkingDir: root,
      entryPoints: [`src/viewer/${module}.mts`],
      bundle: true,
      format,
      ...(format === 'iife' ? { globalName: module === 'routing' ? 'BirdviewRouting' : 'BirdviewI18n' } : {}),
      platform: 'browser',
      target: 'es2022',
      write: false,
      banner: { js: `// Generated from src/viewer/${module}.mts. Do not edit directly.` },
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
  console.log(check ? 'Browser artifacts match TypeScript sources.' : 'Built browser artifacts.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
