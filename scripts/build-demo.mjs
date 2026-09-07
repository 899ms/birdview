import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './validate.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const map = JSON.parse(read('examples/architecture.json'));
const events = read('examples/activity.jsonl').split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
const result = validate(map, events);
if (!result.ok) throw new Error(JSON.stringify(result.errors));
const icons = Object.fromEntries(['play', 'pause', 'rotate-ccw', 'step-forward', 'step-back', 'layers', 'code', 'database', 'globe', 'server', 'check', 'focus', 'sun', 'moon'].map((name) => [name, read(`node_modules/lucide-static/icons/${name}.svg`)]));
const data = JSON.stringify({ map, events, icons }).replace(/</g, '\\u003c');
const html = read('assets/demo.html').replace('/* BIRDVIEW_CSS */', () => read('assets/demo.css')).replace('/* BIRDVIEW_DATA */', () => `const DATA = ${data};`).replace('/* BIRDVIEW_JS */', () => read('assets/demo.js'));
fs.writeFileSync(path.join(root, 'examples/spotlight-demo.html'), html);
console.log('Built examples/spotlight-demo.html');
