const { map, icons } = DATA;
const $ = (id) => document.getElementById(id);
const roles = {
  frontend: { tone: 'blue', icon: 'panels-top-left', label: '前端' },
  backend: { tone: 'teal', icon: 'code', label: '后端' },
  cache: { tone: 'violet', icon: 'zap', label: '缓存' },
  database: { tone: 'violet', icon: 'database', label: '数据存储' },
  queue: { tone: 'amber', icon: 'list-ordered', label: '任务与队列' },
  security: { tone: 'rose', icon: 'shield-check', label: '安全' },
  generic: { tone: 'slate', icon: 'box', label: '通用模块' }
};
/* BIRDVIEW_I18N */
$('brand-icon').innerHTML = icons.focus;
$('project').textContent = map.project.name;
document.title = `${map.project.name} | Birdview`;
$('identity').textContent = `${map.project.id} / ${map.mapId} / v${map.revision}`;
$('count').textContent = `${map.modules.length} / ${map.relationships.length}`;
$('uncertainty').textContent = `${map.modules.filter((module) => module.status === 'uncertain').length} 个模块待确认`;
function themeButton() {
  const light = document.documentElement.dataset.theme === 'light';
  $('theme').innerHTML = icons[light ? 'moon' : 'sun'];
  $('theme').title = $('theme').ariaLabel = t(light ? '切换到深色' : '切换到浅色');
}
$('theme').onclick = () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('birdview-theme', theme); } catch {}
  themeButton();
};
themeButton();

// Compact unused grid tracks while preserving authored row/column ordering.
const rows = [...new Set(map.modules.map((module) => module.layout.row))].sort((a, b) => a - b);
const columns = [...new Set(map.modules.map((module) => module.layout.column))].sort((a, b) => a - b);
const positions = new Map(map.modules.map((module) => [module.id, { x: 28 + columns.indexOf(module.layout.column) * 270, y: 30 + rows.indexOf(module.layout.row) * 180 }]));
let width = Math.max(300, columns.length * 270);
let height = Math.max(220, rows.length * 180);
const groupFrames = [];
const groupLayer = document.createElement('div');
groupLayer.id = 'groups';
$('map').prepend(groupLayer);
if (map.groups?.length) {
  const assigned = new Set(map.groups.flatMap((group) => group.members));
  const ungrouped = map.modules.filter((module) => !assigned.has(module.id));
  let offset = 28;
  const sections = [...map.groups.map((group) => ({ group, modules: map.modules.filter((module) => group.members.includes(module.id)) })), ...(ungrouped.length ? [{ modules: ungrouped }] : [])];
  height = 220;
  for (const section of sections) {
    const sectionRows = [...new Set(section.modules.map((module) => module.layout.row))].sort((a,b) => a-b);
    const sectionColumns = [...new Set(section.modules.map((module) => module.layout.column))].sort((a,b) => a-b);
    const sectionWidth = sectionColumns.length * 240 + 16;
    const sectionHeight = sectionRows.length * 164 + 48;
    for (const module of section.modules) positions.set(module.id, { x: offset + 20 + sectionColumns.indexOf(module.layout.column) * 240, y: 70 + sectionRows.indexOf(module.layout.row) * 164 });
    if (section.group) {
      const frame = document.createElement('div');
      frame.className = 'group-frame';
      Object.assign(frame.style, { left: `${offset}px`, top: '22px', width: `${sectionWidth}px`, height: `${sectionHeight}px` });
      const label = document.createElement('span');
      label.className = 'group-label';
      frame.append(label);
      groupLayer.append(frame);
      groupFrames.push({ label, group: section.group });
    }
    height = Math.max(height, sectionHeight + 44);
    offset += sectionWidth + 44;
  }
  width = offset - 16;
}
$('map').style.width = `${width}px`;
$('map').style.height = `${height}px`;
let zoom = 1;
let fitting = true;
const viewport = document.querySelector('.map-scroll');
function updateZoom() {
  if (fitting) {
    const availableHeight = Math.max(220, window.innerHeight - viewport.getBoundingClientRect().top - 70);
    zoom = Math.min(1, viewport.clientWidth / width, availableHeight / height);
  }
  $('map').style.transform = `scale(${zoom})`;
  $('map-stage').style.width = `${width * zoom}px`;
  $('map-stage').style.height = `${height * zoom}px`;
  $('zoom-value').textContent = `${Math.round(zoom * 100)}%`;
  $('zoom-in').disabled = zoom >= 2;
  $('zoom-out').disabled = zoom <= .1;
  $('fit').setAttribute('aria-pressed', String(fitting));
}
for (const [id, icon] of Object.entries({ 'zoom-in': 'zoom-in', 'zoom-out': 'zoom-out', fit: 'maximize', actual: 'scan' })) $(id).innerHTML = icons[icon];
$('zoom-in').onclick = () => { fitting = false; zoom = Math.min(2, zoom + .15); updateZoom(); };
$('zoom-out').onclick = () => { fitting = false; zoom = Math.max(.1, zoom - .15); updateZoom(); };
$('actual').onclick = () => { fitting = false; zoom = 1; updateZoom(); };
$('fit').onclick = () => { fitting = true; viewport.scrollLeft = 0; updateZoom(); };
new ResizeObserver(() => { if (fitting) updateZoom(); }).observe(viewport);
window.addEventListener('resize', () => { if (fitting) updateZoom(); });
updateZoom();
const svgNS = 'http://www.w3.org/2000/svg';
$('connections').setAttribute('viewBox', `0 0 ${width} ${height}`);
$('connections').style.width = `${width}px`;
$('connections').style.height = `${height}px`;
const defs = document.createElementNS(svgNS, 'defs');
const marker = document.createElementNS(svgNS, 'marker');
for (const [key, value] of Object.entries({ id: 'arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' })) marker.setAttribute(key, value);
const arrow = document.createElementNS(svgNS, 'path');
arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
arrow.setAttribute('fill', '#809487');
marker.append(arrow);
defs.append(marker);
$('connections').append(defs);
const edges = [];
let selectedModuleId;
let hoveredModuleId;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const flowLabel = document.createElement('label');
flowLabel.className = 'flow-toggle';
flowLabel.title = '关系方向动画，不代表实时数据传输';
const flowToggle = document.createElement('input');
flowToggle.type = 'checkbox';
flowToggle.checked = true;
flowToggle.id = 'flow-toggle';
flowLabel.append(flowToggle, document.createTextNode('流向'));
document.querySelector('.map-tools').prepend(flowLabel);
function updateFlow() {
  const activeModuleId = hoveredModuleId ?? selectedModuleId;
  for (const edge of edges) {
    edge.path.classList.toggle('relevant', edge.relation.from === activeModuleId || edge.relation.to === activeModuleId);
    edge.animation?.cancel();
    edge.animation = undefined;
    const active = flowToggle.checked && !reducedMotion.matches && !document.hidden && edge.path.classList.contains('relevant');
    edge.dot.style.display = active ? '' : 'none';
    if (!active) continue;
    // Sample the existing path so the moving marker follows every routing shape.
    const length = edge.path.getTotalLength();
    const frames = Array.from({ length: 61 }, (_, index) => {
      const point = edge.path.getPointAtLength(length * index / 60);
      return { transform: `translate(${point.x}px, ${point.y}px)` };
    });
    edge.animation = edge.dot.animate(frames, { duration: Math.max(1200, length / 90 * 1000), iterations: Infinity, easing: 'linear' });
  }
}
flowToggle.onchange = updateFlow;
reducedMotion.addEventListener('change', updateFlow);
document.addEventListener('visibilitychange', updateFlow);
for (const relation of map.relationships) {
  const from = positions.get(relation.from), to = positions.get(relation.to);
  const path = document.createElementNS(svgNS, 'path');
  let d;
  if (relation.from === relation.to) {
    d = `M ${from.x + 140} ${from.y} C ${from.x + 180} ${from.y - 28}, ${from.x + 50} ${from.y - 28}, ${from.x + 90} ${from.y}`;
  } else if (from.x === to.x) {
    const down = to.y > from.y;
    const y1 = from.y + (down ? 88 : 0), y2 = to.y + (down ? 0 : 88);
    d = `M ${from.x + 95} ${y1} L ${to.x + 95} ${y2}`;
  } else {
    const right = to.x > from.x;
    const x1 = from.x + (right ? 190 : 0), x2 = to.x + (right ? 0 : 190);
    d = `M ${x1} ${from.y + 44} C ${(x1 + x2) / 2} ${from.y + 44}, ${(x1 + x2) / 2} ${to.y + 44}, ${x2} ${to.y + 44}`;
  }
  path.setAttribute('d', d);
  path.setAttribute('class', 'edge');
  path.setAttribute('marker-end', 'url(#arrow)');
  if (relation.status === 'uncertain') path.setAttribute('stroke-dasharray', '5 4');
  const title = document.createElementNS(svgNS, 'title');
  title.textContent = relation.label;
  path.append(title);
  $('connections').append(path);
  const dot = document.createElementNS(svgNS, 'circle');
  dot.setAttribute('r', '3');
  dot.setAttribute('class', 'flow-dot');
  dot.setAttribute('aria-hidden', 'true');
  dot.style.display = 'none';
  $('connections').append(dot);
  edges.push({ path, relation, dot });
}
const buttons = new Map();
for (const module of map.modules) {
  const button = document.createElement('button');
  button.className = 'node';
  button.dataset.module = module.id;
  button.dataset.kind = module.kind;
  const role = roles[module.role || 'generic'];
  button.dataset.tone = role.tone;
  button.style.left = `${positions.get(module.id).x}px`;
  button.style.top = `${positions.get(module.id).y}px`;
  button.setAttribute('aria-label', module.name);
  const icon = document.createElement('span');
  icon.className = 'node-top';
  icon.innerHTML = icons[role.icon];
  const name = document.createElement('strong');
  name.textContent = module.name;
  const status = document.createElement('small');
  status.textContent = module.responsibility;
  button.title = `${module.name}\n${module.responsibility}`;
  button.append(icon, name, status);
  if (module.status === 'uncertain') {
    const mark = document.createElement('span');
    mark.className = 'uncertain-mark';
    mark.textContent = '?';
    mark.title = '待确认';
    mark.setAttribute('aria-label', '待确认');
    button.append(mark);
    button.setAttribute('aria-label', `${module.name}，待确认`);
  }
  button.onclick = () => { select(module); setInspector(true); };
  button.onpointerenter = (event) => {
    if (event.pointerType === 'touch') return;
    hoveredModuleId = module.id;
    updateFlow();
  };
  button.onpointerleave = () => {
    if (hoveredModuleId !== module.id) return;
    hoveredModuleId = undefined;
    updateFlow();
  };
  $('nodes').append(button);
  for (let size = 13; size > 10 && name.scrollHeight > name.clientHeight; size--) name.style.fontSize = `${size - 1}px`;
  buttons.set(module.id, button);
}
const moduleMeta = document.createElement('div');
const roleLegend = document.createElement('div');
roleLegend.className = 'role-legend';
document.querySelector('.legend').prepend(roleLegend);
moduleMeta.className = 'module-meta';
$('module-name').after(moduleMeta);
const workspace = document.querySelector('.workspace');
const inspector = document.querySelector('aside');
const closeDetails = document.createElement('button');
closeDetails.id = 'close-details';
closeDetails.innerHTML = icons.x;
inspector.prepend(closeDetails);
const showDetails = document.createElement('button');
showDetails.id = 'show-details';
showDetails.innerHTML = icons['panel-right'];
document.querySelector('.map-tools').append(showDetails);
function setInspector(open) {
  workspace.classList.toggle('inspector-open', open);
  showDetails.setAttribute('aria-expanded', String(open));
  if (fitting) updateZoom();
}
closeDetails.onclick = () => { setInspector(false); showDetails.focus(); };
showDetails.onclick = () => setInspector(!workspace.classList.contains('inspector-open'));
inspector.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDetails.click(); });
function select(module) {
  selectedModuleId = module.id;
  for (const [id, button] of buttons) {
    button.classList.toggle('selected', id === module.id);
    button.setAttribute('aria-pressed', String(id === module.id));
  }
  $('module-name').textContent = localized(module, 'name');
  moduleMeta.textContent = `${t(roles[module.role || 'generic'].label)} · ${t(module.kind === 'external' ? '外部服务' : '本地模块')} · ${t(module.status === 'uncertain' ? '待确认' : '有来源证据')}`;
  $('responsibility').textContent = localized(module, 'responsibility');
  $('ownership').replaceChildren();
  for (const owner of module.ownership) {
    const li = document.createElement('li');
    li.textContent = owner.path;
    $('ownership').append(li);
  }
  if (!module.ownership.length) $('ownership').textContent = t('无本地文件归属');
  $('evidence').textContent = module.evidence.map((item) => `${item.path}${item.line ? `:${item.line}` : ''}${item.symbol ? ` · ${item.symbol}` : ''}\n${localized(item, 'note')}`).join('\n\n') || t('无来源证据');
  $('questions').textContent = localized(module, 'openQuestions').join('\n') || t('无已记录的待确认项');
  $('relations').replaceChildren();
  for (const { path, relation } of edges) {
    const relevant = relation.from === module.id || relation.to === module.id;
    path.classList.toggle('relevant', relevant);
    if (!relevant) continue;
    const li = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${localized(map.modules.find((item) => item.id === relation.from), 'name')} → ${localized(map.modules.find((item) => item.id === relation.to), 'name')}`;
    const label = document.createElement('span');
    label.textContent = [localized(relation, 'label'), ...relation.evidence.map((item) => `${item.path}${item.line ? `:${item.line}` : ''} · ${localized(item, 'note')}`), ...localized(relation, 'openQuestions')].join(' · ');
    li.append(title, label);
    $('relations').append(li);
  }
  if (!$('relations').children.length) $('relations').textContent = t('无已记录的关系');
  updateFlow();
}
applyLanguage();
