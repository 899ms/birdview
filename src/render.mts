import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validate } from './validate.mjs';

export interface RenderOptions { simulation?: boolean }
// Source: src/render.mts. Regenerate scripts/render.mjs with npm run build.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file: string): string => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
const dataUrl = (file: string, type: string): string => `data:${type};base64,${fs.readFileSync(path.join(root, file)).toString('base64')}`;

export function renderArchitecture(map: unknown, events: readonly unknown[] = [], { simulation = false }: RenderOptions = {}): string {
  const result = validate(map, events);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  const icons = Object.fromEntries(['sun', 'moon', 'layers', 'database', 'zoom-in', 'zoom-out', 'maximize', 'scan', 'x', 'panel-right', 'panels-top-left', 'code', 'zap', 'list-ordered', 'shield-check', 'box', 'skip-forward', 'columns-2', 'chevron-left', 'chevron-right'].map((name) => [name, read(`node_modules/lucide-static/icons/${name}.svg`)]));
  const brandLogo = dataUrl('assets/brand/logo-192.png', 'image/png');
  const data = JSON.stringify({ map, icons, events, simulation, brandLogo }).replace(/</g, '\\u003c');
  return read('assets/architecture.html')
    .replace('<head>', () => `<head>\n<!--\n${read('LICENSE')}\n${read('THIRD_PARTY_NOTICES')}\n-->`)
    .replace('/* BIRDVIEW_FAVICON */', () => dataUrl('assets/brand/favicon-32.png', 'image/png'))
    .replace('/* BIRDVIEW_CSS */', () => read('assets/demo.css'))
    .replace('/* BIRDVIEW_DATA */', () => `const DATA = ${data};`)
    .replace('/* BIRDVIEW_JS */', () => read('assets/architecture.js')
      .replace('/* BIRDVIEW_I18N */', () => `${read('assets/architecture-i18n-core.js')}\n${read('assets/architecture-i18n.js')}`)
      .replace('/* BIRDVIEW_ROUTING */', () => read('assets/architecture-routing.js'))
      .replace('/* BIRDVIEW_ACTIVITY */', () => read('assets/architecture-activity.js'))
      .replace('/* BIRDVIEW_CONSTRAINTS */', () => read('assets/architecture-constraints.js'))
      .replace('/* BIRDVIEW_GUIDE */', () => read('assets/architecture-guide.js')))
    .replace('/* BIRDVIEW_GUIDE_CSS */', () => read('assets/architecture-guide.css'))
    .replace('/* BIRDVIEW_CONSTRAINTS_CSS */', () => read('assets/architecture-constraints.css'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const simulation = args.includes('--simulation');
    const [input, output, activity, ...extra] = args.filter(arg => arg !== '--simulation');
    if (!input || !output || extra.length) throw new Error('Usage: node scripts/render.mjs architecture.json architecture.html [activity.jsonl] [--simulation]');
    if (path.extname(output).toLowerCase() !== '.html') throw new Error('Output must be an .html file.');
    if (path.resolve(input).toLowerCase() === path.resolve(output).toLowerCase()) throw new Error('Input and output must differ.');
    if (activity && path.resolve(activity).toLowerCase() === path.resolve(output).toLowerCase()) throw new Error('Activity input and output must differ.');
    const events: unknown[] = activity ? fs.readFileSync(activity, 'utf8').split(/\r?\n/).filter(line => line.trim()).map((line, i): unknown => {
      try { return JSON.parse(line); } catch { throw new Error(`Invalid JSON in activity record ${i + 1}.`); }
    }) : [];
    const map: unknown = JSON.parse(fs.readFileSync(input, 'utf8'));
    const html = renderArchitecture(map, events, { simulation });
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, html);
    console.log(path.resolve(output));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
