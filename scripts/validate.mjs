import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const architectureSchema = readJson(path.join(root, 'schemas/architecture.schema.json'));
ajv.addSchema(architectureSchema);
const mapSchema = ajv.getSchema(architectureSchema.$id);
const eventSchema = ajv.compile(readJson(path.join(root, 'schemas/activity.schema.json')));
const terminal = new Set(['completed', 'failed', 'cancelled']);
const sameSet = (left, right) => left.length === right.length && left.every((value) => right.includes(value));

export function validate(map, events = [], { requireBilingual = false, requireRoles = false } = {}) {
  const errors = [];
  const warnings = [];
  const error = (code, location, message) => errors.push({ code, location, message });
  if (!mapSchema(map)) return { ok: false, errors: mapSchema.errors.map((item) => ({ code: 'schema/architecture', location: item.instancePath, message: item.message })) };
  if (requireBilingual && !map.language) error('translation/base-language', '/language', 'Bilingual maps must declare the base language.');
  function translations(item, location) {
    const fields = ['name', 'responsibility', 'label', 'note', 'openQuestions'].filter((field) => Object.hasOwn(item, field));
    for (const [locale, translated] of Object.entries(item.translations || {})) {
      for (const field of Object.keys(translated)) {
        if (!fields.includes(field)) error('translation/field', `${location}/translations/${locale}/${field}`, 'Only text fields on this object can be translated.');
      }
      if (translated.openQuestions && translated.openQuestions.length !== item.openQuestions?.length) error('translation/questions', `${location}/translations/${locale}/openQuestions`, 'Translated questions must preserve the original count and order.');
    }
    if (requireBilingual) {
      for (const locale of ['zh', 'en']) {
        if (locale === map.language) continue;
        for (const field of fields) {
          if (Array.isArray(item[field]) && !item[field].length) continue;
          if (item.translations?.[locale]?.[field] === undefined) error('translation/missing', `${location}/translations/${locale}/${field}`, 'Missing text for bilingual delivery.');
        }
      }
    }
    item.evidence?.forEach((source, index) => translations(source, `${location}/evidence/${index}`));
  }
  translations(map.project, '/project');
  map.modules.forEach((item, index) => {
    translations(item, `/modules/${index}`);
    if (item.roleAssessment) translations(item.roleAssessment, `/modules/${index}/roleAssessment`);
  });
  map.relationships.forEach((item, index) => translations(item, `/relationships/${index}`));
  const groupIds = new Set();
  const grouped = new Set();
  (map.groups || []).forEach((group, index) => {
    translations(group, `/groups/${index}`);
    if (groupIds.has(group.id)) error('group/duplicate-id', `/groups/${index}`, 'Group IDs must be unique.');
    groupIds.add(group.id);
    for (const id of group.members) {
      if (!map.modules.some((module) => module.id === id)) error('group/unknown-member', `/groups/${index}`, `Unknown member ${id}.`);
      if (grouped.has(id)) error('group/overlap', `/groups/${index}`, 'A module can belong to only one group.');
      grouped.add(id);
    }
  });
  const nodes = new Set();
  const cells = new Set();
  function evidence(item, location) {
    if (item.status === 'uncertain' && !item.openQuestions.length) error('evidence/question-required', location, 'Uncertain claims require an open question.');
    if (item.status === 'supported' && item.kind !== 'external' && !item.evidence.length) error('evidence/source-required', location, 'Supported claims require source evidence.');
    item.evidence.forEach((source, index) => {
      if (source.endLine !== undefined && source.endLine < source.line) error('evidence/line-order', `${location}/evidence/${index}`, 'endLine precedes line.');
    });
  }
  map.modules.forEach((node, index) => {
    const location = `/modules/${index}`;
    if (requireRoles && !node.role) error('role/required', `${location}/role`, 'Newly authored maps require an explicit role for every module.');
    if (requireRoles && node.role === 'generic' && !node.roleAssessment) error('role/reason-required', `${location}/roleAssessment`, 'Explain why no specific role applies or which evidence is missing.');
    if (node.roleAssessment) {
      if (node.role !== 'generic') error('role/assessment-target', `${location}/roleAssessment`, 'A generic-role assessment requires explicit role generic.');
      if (node.roleAssessment.basis === 'insufficient-evidence' && node.status !== 'uncertain') error('role/uncertainty-required', `${location}/status`, 'Insufficient classification evidence requires uncertain status and a specific open question.');
    }
    if (nodes.has(node.id)) error('map/duplicate-id', location, `Duplicate module ${node.id}.`);
    nodes.add(node.id);
    const cell = `${node.layout.row}:${node.layout.column}`;
    if (cells.has(cell)) error('map/occupied-cell', location, `Grid cell ${cell} is already occupied.`);
    cells.add(cell);
    if (node.kind === 'local' && (!node.ownership.length || !node.evidence.length)) error('map/local-evidence', location, 'Local modules require ownership and evidence.');
    if (node.kind === 'external' && node.ownership.length) error('map/external-ownership', location, 'External modules cannot own local files.');
    evidence(node, location);
  });
  const relationships = new Set();
  map.relationships.forEach((relation, index) => {
    const location = `/relationships/${index}`;
    if (relationships.has(relation.id)) error('map/duplicate-relationship', location, 'Relationship IDs must be unique.');
    relationships.add(relation.id);
    if (!nodes.has(relation.from) || !nodes.has(relation.to)) error('map/unknown-endpoint', location, 'Relationship endpoint does not exist.');
    evidence(relation, location);
  });
  let session;
  let task;
  let scope = [];
  const closedTasks = new Set();
  events.forEach((event, index) => {
    const location = `/events/${index}`;
    if (!eventSchema(event)) {
      for (const issue of eventSchema.errors) error('schema/activity', location + issue.instancePath, issue.message);
      return;
    }
    if (event.mapId !== map.mapId || event.mapRevision !== map.revision || event.projectId !== map.project.id) error('activity/map-mismatch', location, 'Event targets another project or map revision.');
    if (event.sequence !== index + 1) error('activity/sequence', location, 'Sequences must start at 1 and remain contiguous.');
    if (session && session !== event.sessionId) error('activity/session', location, 'One event file belongs to one session.');
    session = event.sessionId;
    if (event.scope.some((id) => !nodes.has(id))) error('activity/unknown-module', location, 'Scope contains an unknown module.');
    if (event.targets.some((id) => !event.scope.includes(id))) error('activity/outside-scope', location, 'Targets must belong to the declared scope.');
    if (!terminal.has(event.phase) && !event.targets.length) error('activity/empty-targets', location, 'Active steps require targets.');
    if (closedTasks.has(event.taskId)) error('activity/closed-task', location, 'A terminal task cannot reopen.');
    if (task !== event.taskId) {
      if (task) error('activity/concurrent-task', location, 'Finish the current task before starting another.');
      if (event.phase !== 'planned') error('activity/plan-required', location, 'New tasks start with planned.');
      task = event.taskId;
      scope = event.scope;
    } else if (event.phase !== 'planned' && !sameSet(scope, event.scope)) {
      error('activity/scope-change', location, 'Declare scope changes in a planned event first.');
    }
    if (event.phase === 'planned') scope = event.scope;
    const unmapped = [];
    for (const file of event.files) {
      const owners = map.modules.filter((node) => node.ownership.some((rule) => rule.kind === 'file' ? rule.path === file : file.startsWith(`${rule.path}/`)));
      if (!owners.length) unmapped.push(file);
      if (['planned', 'editing'].includes(event.phase) && owners.some((node) => !event.targets.includes(node.id))) error('activity/file-target', location, `File ${file} belongs to a module outside current targets.`);
    }
    if (!sameSet(unmapped, event.unmappedFiles)) error('activity/unmapped-files', location, 'unmappedFiles must exactly identify files without ownership.');
    for (const check of event.checks) {
      if ((check.status === 'passed' && check.exitCode !== 0) || (check.status === 'failed' && (check.exitCode === null || check.exitCode === 0)) || (check.status === 'not-run' && check.exitCode !== null)) error('activity/check-result', location, 'Check status contradicts its exit code.');
      if (event.phase === 'completed' && check.status === 'failed') error('activity/failed-completion', location, 'A completion cannot claim a failed check as successful.');
    }
    if (terminal.has(event.phase)) { closedTasks.add(event.taskId); task = undefined; }
  });
  if (map.modules.every(node => !node.role || node.role === 'generic')) warnings.push({ code: 'role/all-generic-review', location: '/modules', message: 'Every module is generic or unclassified. Review each responsibility against source evidence and explain the classifications at delivery; do not invent role diversity to silence this warning.' });
  return { ok: !errors.length, modules: map.modules.length, relationships: map.relationships.length, events: events.length, errors, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const requireBilingual = args.includes('--bilingual');
    const requireRoles = args.includes('--authoring');
    const [mapPath, eventPath, ...extra] = args.filter((arg) => !['--bilingual', '--authoring'].includes(arg));
    if (!mapPath || extra.length) throw new Error('Usage: node scripts/validate.mjs architecture.json [activity.jsonl] [--bilingual] [--authoring]');
    const events = eventPath ? fs.readFileSync(eventPath, 'utf8').split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
      try { return JSON.parse(line); } catch { throw new Error(`Invalid JSON in event record ${index + 1}.`); }
    }) : [];
    const receipt = validate(readJson(mapPath), events, { requireBilingual, requireRoles });
    console.log(JSON.stringify(receipt, null, 2));
    process.exitCode = receipt.ok ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({ ok: false, errors: [{ code: 'input/read', message: err.message }] }, null, 2));
    process.exitCode = 1;
  }
}
