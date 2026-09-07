import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validate } from './validate.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

export function renderArchitecture(map) {
  const result = validate(map);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  const icons = Object.fromEntries(['focus', 'sun', 'moon', 'layers', 'database', 'zoom-in', 'zoom-out', 'maximize', 'scan'].map((name) => [name, read(`node_modules/lucide-static/icons/${name}.svg`)]));
  const data = JSON.stringify({ map, icons }).replace(/</g, '\\u003c');
  return read('assets/architecture.html')
    .replace('/* BIRDVIEW_CSS */', () => read('assets/demo.css'))
    .replace('/* BIRDVIEW_DATA */', () => `const DATA = ${data};`)
    .replace('/* BIRDVIEW_JS */', () => read('assets/architecture.js').replace('/* BIRDVIEW_I18N */', () => read('assets/architecture-i18n.js')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [input, output, ...extra] = process.argv.slice(2);
    if (!input || !output || extra.length) throw new Error('Usage: node scripts/render.mjs architecture.json architecture.html');
    if (path.extname(output).toLowerCase() !== '.html') throw new Error('Output must be an .html file.');
    if (path.resolve(input).toLowerCase() === path.resolve(output).toLowerCase()) throw new Error('Input and output must differ.');
    const html = renderArchitecture(JSON.parse(fs.readFileSync(input, 'utf8')));
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, html);
    console.log(path.resolve(output));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
