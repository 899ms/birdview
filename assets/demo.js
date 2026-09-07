const $ = (id) => document.getElementById(id);
const { map, events, icons } = DATA;
const phases = { planned: '计划', editing: '修改中', verifying: '验证中', completed: '完成', failed: '失败', cancelled: '取消' };
const titles = ['声明修改范围', '调整 API 回退逻辑', '配置缓存过期策略', '验证缓存命中与回退', '本次修改完成'];
const reasons = ['本次计划修改 Product API 与 Cache Adapter，保留持久化存储接口。', '先调整商品 API 的缓存回退逻辑。当前只修改 API，缓存适配器仍属于整体计划范围。', '修改缓存适配器的过期策略。API 留在计划范围内，当前聚光灯移至缓存模块。', '检查两个模块协作时的缓存命中与回退路径。测试文件尚未归属到架构模块。', '两个计划模块的模拟修改结束，示例验证结果为通过。'];
let index = 1;
let selected = 'api';
let timer;
const nodeElements = new Map();
const edgeElements = [];
document.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = icons[element.dataset.icon]; });
function updateThemeButton() {
  const light = document.documentElement.dataset.theme === 'light';
  $('theme').innerHTML = icons[light ? 'moon' : 'sun'];
  $('theme').title = $('theme').ariaLabel = light ? '切换到深色' : '切换到浅色';
}
$('theme').onclick = () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('birdview-theme', theme); } catch {}
  updateThemeButton();
};
updateThemeButton();

const rows = Math.max(...map.modules.map((module) => module.layout.row)) + 1;
const columns = Math.max(...map.modules.map((module) => module.layout.column)) + 1;
function point(module) {
  return { x: 3 + module.layout.column * (94 / columns), y: (module.layout.row + .5) * 100 / rows };
}
for (const module of map.modules) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = 'node';
  node.dataset.module = module.id;
  node.setAttribute('aria-label', module.name);
  const position = point(module);
  node.style.left = `${position.x}%`;
  node.style.top = `${position.y}%`;
  const top = document.createElement('span');
  top.className = 'node-top';
  const icon = document.createElement('span');
  icon.innerHTML = icons[module.kind === 'external' ? 'database' : module.id === 'web' ? 'globe' : module.id === 'api' ? 'server' : 'layers'];
  const kind = document.createElement('span');
  kind.className = 'kind';
  kind.textContent = module.kind === 'external' ? 'EXTERNAL' : 'MODULE';
  top.append(icon, kind);
  const name = document.createElement('strong');
  name.textContent = module.name;
  const state = document.createElement('small');
  node.append(top, name, state);
  node.onclick = () => { selected = module.id; render(); };
  $('nodes').append(node);
  nodeElements.set(module.id, node);
}
const svgNS = 'http://www.w3.org/2000/svg';
$('connections').setAttribute('viewBox', '0 0 1000 394');
$('connections').setAttribute('preserveAspectRatio', 'none');
for (const relation of map.relationships) {
  const from = point(map.modules.find((module) => module.id === relation.from));
  const to = point(map.modules.find((module) => module.id === relation.to));
  const x1 = (from.x + 20) * 10, x2 = to.x * 10;
  const y1 = from.y * 3.94, y2 = to.y * 3.94;
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`);
  const title = document.createElementNS(svgNS, 'title');
  title.textContent = relation.label;
  path.append(title);
  $('connections').append(path);
  edgeElements.push({ path, relation });
}
events.forEach((event, stepIndex) => {
  const button = document.createElement('button');
  button.className = 'step';
  const number = document.createElement('span');
  number.textContent = String(stepIndex + 1).padStart(2, '0');
  button.append(number, document.createTextNode(titles[stepIndex]));
  button.onclick = () => go(stepIndex);
  $('steps').append(button);
});
function render() {
  const event = events[index];
  $('phase').textContent = phases[event.phase];
  $('position').textContent = `${index + 1} / ${events.length}`;
  $('event-title').textContent = titles[index];
  $('reason').textContent = reasons[index];
  $('scope-count').textContent = `${event.scope.length} / ${map.modules.length}`;
  $('seek').value = index;
  $('seek').setAttribute('aria-valuetext', titles[index]);
  $('prev').disabled = index === 0;
  $('next').disabled = index === events.length - 1;
  for (const module of map.modules) {
    const node = nodeElements.get(module.id);
    const target = event.targets.includes(module.id);
    const scope = event.scope.includes(module.id);
    node.className = `node ${scope ? 'scope' : $('spotlight').checked ? 'dim' : ''} ${target ? `target ${event.phase}` : ''} ${selected === module.id ? 'selected' : ''}`;
    node.setAttribute('aria-pressed', String(selected === module.id));
    node.querySelector('small').textContent = target ? phases[event.phase] : scope ? '计划范围' : '范围外';
  }
  for (const { path, relation } of edgeElements) {
    path.setAttribute('class', `edge ${event.scope.includes(relation.from) && event.scope.includes(relation.to) ? 'relevant' : $('spotlight').checked ? 'dim' : ''}`);
  }
  const currentNode = nodeElements.get(event.targets[0]);
  const scroller = document.querySelector('.map-scroll');
  if (currentNode && scroller.scrollWidth > scroller.clientWidth) {
    const left = currentNode.offsetLeft;
    if (left < scroller.scrollLeft || left + currentNode.offsetWidth > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({ left: left - (scroller.clientWidth - currentNode.offsetWidth) / 2 });
    }
  }
  $('files').replaceChildren();
  for (const file of event.files) {
    const item = document.createElement('li');
    item.textContent = file;
    if (event.unmappedFiles.includes(file)) {
      const label = document.createElement('span');
      label.className = 'unmapped';
      label.textContent = '未映射';
      item.append(label);
    }
    $('files').append(item);
  }
  $('checks').textContent = event.checks.map((check) => `${check.status === 'passed' ? '模拟通过' : check.status === 'failed' ? '模拟失败' : '等待验证'} · ${check.command}`).join('\n');
  const module = map.modules.find((item) => item.id === selected);
  $('module-name').textContent = module.name;
  $('responsibility').textContent = module.responsibility;
  $('ownership').replaceChildren();
  for (const owner of module.ownership) {
    const line = document.createElement('code');
    line.textContent = owner.path;
    $('ownership').append(line, document.createElement('br'));
  }
  $('evidence').textContent = [...module.evidence.map((item) => `${item.path}${item.symbol ? ` · ${item.symbol}` : ''}`), ...module.openQuestions].join('\n') || '无本地来源证据';
  Array.from($('steps').children).forEach((step, i) => { step.className = `step ${i === index ? 'current' : i < index ? 'past' : ''}`; step.setAttribute('aria-current', i === index ? 'step' : 'false'); });
}
function stop() {
  clearTimeout(timer);
  timer = undefined;
  $('play').innerHTML = icons.play;
  $('play').title = $('play').ariaLabel = index === events.length - 1 ? '重播' : '播放';
}
function go(nextIndex) {
  stop();
  index = Math.max(0, Math.min(events.length - 1, nextIndex));
  selected = events[index].targets[0] || selected;
  render();
  stop();
}
function schedule() {
  $('play').innerHTML = icons.pause;
  $('play').title = $('play').ariaLabel = '暂停';
  timer = setTimeout(() => {
    index++;
    selected = events[index].targets[0] || selected;
    render();
    if (index === events.length - 1) stop();
    else schedule();
  }, 2600 / Number($('speed').value));
}
$('play').onclick = () => { if (timer) stop(); else { if (index === events.length - 1) go(0); schedule(); } };
$('restart').onclick = () => { go(0); schedule(); };
$('prev').onclick = () => go(index - 1);
$('next').onclick = () => go(index + 1);
$('seek').oninput = () => go(Number($('seek').value));
$('speed').onchange = () => { if (timer) { stop(); schedule(); } };
$('spotlight').onchange = render;
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
render();
