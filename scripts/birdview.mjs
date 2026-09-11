#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const start = '<!-- birdview:mode:start -->';
const end = '<!-- birdview:mode:end -->';

try {
  const args = process.argv.slice(2);
  if (args.shift() !== 'mode') throw new Error('Usage: birdview mode [auto|on-demand] [--project <root>]');
  let mode;
  if (args[0] && !args[0].startsWith('--')) mode = args.shift();
  let root = process.cwd();
  if (args[0] === '--project' && args[1]) {
    root = path.resolve(args[1]);
    args.splice(0, 2);
  }
  if (args.length || (mode && !['auto', 'on-demand'].includes(mode))) throw new Error('Usage: birdview mode [auto|on-demand] [--project <root>]');
  if (!fs.statSync(root).isDirectory()) throw new Error('Project root must be a directory.');
  const file = path.join(root, 'AGENTS.md');
  let info;
  try { info = fs.lstatSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (info && !info.isFile()) throw new Error('AGENTS.md must be a regular file, not a link or directory.');
  const original = info ? fs.readFileSync(file, 'utf8') : '';
  const starts = original.split(start).length - 1;
  const ends = original.split(end).length - 1;
  const from = original.indexOf(start);
  const to = original.indexOf(end);
  if (starts !== ends || starts > 1 || (starts && to < from)) throw new Error('Malformed or duplicate Birdview block; AGENTS.md was not changed.');
  const existing = starts ? original.slice(from, to + end.length) : '';
  const current = existing.match(/^Birdview mode: (auto|on-demand)\r?$/m)?.[1];
  if (existing && !current) throw new Error('Unrecognized Birdview mode block; AGENTS.md was not changed.');
  if (!mode) {
    console.log(`${current || 'on-demand'}${current ? '' : ' (default; no project block)'}\n${file}`);
  } else {
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    const trigger = mode === 'auto'
      ? 'Use the Birdview skill before every code-changing task, including small edits, and for planning that explicitly analyzes affected modules. Enter the workflow once per task; update activity before each edit group, not each line.'
      : 'Use the Birdview skill only when the user explicitly requests Birdview or asks to see an architecture/change map before editing (for example: 改前先看图). Ordinary coding or feature-planning requests do not activate Birdview.';
    const block = [start, `Birdview mode: ${mode}`, trigger,
      'When active, first inspect existing project maps and report the reusable path or checked locations and why a new map is needed. Follow the skill to validate/reuse the map, preview it, and declare affected modules before editing.',
      'Planning alone does not authorize code edits or fabricated activity. A one-task request overrides this mode for that task without changing this block. If the skill is unavailable, report it rather than claim its workflow ran.',
      'This is agent guidance, not a filesystem write interceptor. Preserve all instructions outside this managed block.', end].join(eol);
    const updated = existing ? original.slice(0, from) + block + original.slice(to + end.length)
      : original + (original && !original.endsWith('\n') ? eol : '') + (original ? eol : '') + block + eol;
    if (updated !== original) fs.writeFileSync(file, updated, 'utf8');
    console.log(`${mode}\n${file}${updated === original ? '\nUnchanged.' : '\nUpdated managed block.'}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
