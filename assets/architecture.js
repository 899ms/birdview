const { map, icons } = DATA;
const $ = (id) => document.getElementById(id);
$('brand-icon').innerHTML = icons.focus;
$('project').textContent = map.project.name;
document.title = `${map.project.name} | Birdview`;
$('identity').textContent = `${map.project.id} / ${map.mapId} / v${map.revision}`;
$('count').textContent = `${map.modules.length} / ${map.relationships.length}`;
$('uncertainty').textContent = `${map.modules.filter((module) => module.status === 'uncertain').length} 个模块待确认`;
function themeButton() {
  const light = document.documentElement.dataset.theme === 'light';
  $('theme').innerHTML = icons[light ? 'moon' : 'sun'];
  $('theme').title = $('theme').ariaLabel = light ? '切换到深色' : '切换到浅色';
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
const width = Math.max(300, columns.length * 270);
const height = Math.max(220, rows.length * 180);
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
for (const relation of map.relationships) {
  const from = positions.get(relation.from), to = positions.get(relation.to);
  const path = document.createElementNS(svgNS, 'path');
  let d;
  if (relation.from === relation.to) {
    d = `M ${from.x + 140} ${from.y} C ${from.x + 180} ${from.y - 28}, ${from.x + 50} ${from.y - 28}, ${from.x + 90} ${from.y}`;
  } else if (from.x === to.x) {
    const down = to.y > from.y;
    const y1 = from.y + (down ? 112 : 0), y2 = to.y + (down ? 0 : 112);
    d = `M ${from.x + 95} ${y1} L ${to.x + 95} ${y2}`;
  } else {
    const right = to.x > from.x;
    const x1 = from.x + (right ? 190 : 0), x2 = to.x + (right ? 0 : 190);
    d = `M ${x1} ${from.y + 56} C ${(x1 + x2) / 2} ${from.y + 56}, ${(x1 + x2) / 2} ${to.y + 56}, ${x2} ${to.y + 56}`;
  }
  path.setAttribute('d', d);
  path.setAttribute('class', 'edge');
  path.setAttribute('marker-end', 'url(#arrow)');
  if (relation.status === 'uncertain') path.setAttribute('stroke-dasharray', '5 4');
  const title = document.createElementNS(svgNS, 'title');
  title.textContent = relation.label;
  path.append(title);
  $('connections').append(path);
  edges.push({ path, relation });
}
const buttons = new Map();
for (const module of map.modules) {
  const button = document.createElement('button');
  button.className = 'node';
  button.dataset.module = module.id;
  button.style.left = `${positions.get(module.id).x}px`;
  button.style.top = `${positions.get(module.id).y}px`;
  button.setAttribute('aria-label', module.name);
  const icon = document.createElement('span');
  icon.className = 'node-top';
  icon.innerHTML = icons[module.kind === 'external' ? 'database' : 'layers'];
  const name = document.createElement('strong');
  name.textContent = module.name;
  const status = document.createElement('small');
  status.textContent = `${module.kind === 'external' ? '外部服务' : '本地模块'} · ${module.status === 'uncertain' ? '待确认' : '有来源证据'}`;
  button.append(icon, name, status);
  button.onclick = () => select(module);
  $('nodes').append(button);
  buttons.set(module.id, button);
}
function select(module) {
  for (const [id, button] of buttons) {
    button.classList.toggle('selected', id === module.id);
    button.setAttribute('aria-pressed', String(id === module.id));
  }
  $('module-name').textContent = module.name;
  $('responsibility').textContent = module.responsibility;
  $('ownership').replaceChildren();
  for (const owner of module.ownership) {
    const li = document.createElement('li');
    li.textContent = owner.path;
    $('ownership').append(li);
  }
  if (!module.ownership.length) $('ownership').textContent = '无本地文件归属';
  $('evidence').textContent = module.evidence.map((item) => `${item.path}${item.line ? `:${item.line}` : ''}${item.symbol ? ` · ${item.symbol}` : ''}\n${item.note}`).join('\n\n') || '无来源证据';
  $('questions').textContent = module.openQuestions.join('\n') || '无已记录的待确认项';
  $('relations').replaceChildren();
  for (const { path, relation } of edges) {
    const relevant = relation.from === module.id || relation.to === module.id;
    path.classList.toggle('relevant', relevant);
    if (!relevant) continue;
    const li = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${map.modules.find((item) => item.id === relation.from).name} → ${map.modules.find((item) => item.id === relation.to).name}`;
    const label = document.createElement('span');
    label.textContent = [relation.label, ...relation.evidence.map((item) => `${item.path}${item.line ? `:${item.line}` : ''} · ${item.note}`), ...relation.openQuestions].join(' · ');
    li.append(title, label);
    $('relations').append(li);
  }
  if (!$('relations').children.length) $('relations').textContent = '无已记录的关系';
}
if (map.modules.length) select(map.modules[0]);
