const activityEvents = DATA.events || [];
let activityIndex = DATA.simulation ? 0 : Math.max(0, activityEvents.length - 1);
let activityMode = activityEvents.length ? 'activity' : 'architecture';
const activityPanel = document.createElement('section');
activityPanel.className = 'activity-panel';
activityPanel.hidden = !activityEvents.length;
activityPanel.innerHTML = '<div class="activity-toolbar"><div id="activity-mode" role="group"></div><span id="activity-source"></span><div class="activity-history"><button id="activity-prev"></button><select id="activity-step"></select><button id="activity-next"></button><button id="activity-latest"></button></div></div><div id="activity-summary" aria-live="polite"></div><details id="activity-disclosure"><summary></summary><div id="activity-details"></div></details>';
document.querySelector('.workspace').before(activityPanel);
const mapHeading = document.querySelector('.map-heading');
new ResizeObserver(() => workspace.style.setProperty('--toolbar-height', `${mapHeading.offsetHeight}px`)).observe(mapHeading);
const mapTools = document.querySelector('.map-tools');
const moreMenu = $('more-menu');
const moreButton = $('more');
moreButton.onclick = () => { moreMenu.hidden = !moreMenu.hidden; };
document.addEventListener('pointerdown', event => { if (!event.target.closest('#more-menu, #more')) moreMenu.hidden = true; });
const relationTools = document.createElement('div');
relationTools.className = 'relation-tools';
relationTools.append(relationView, flowLabel);
const zoomTools = document.createElement('div');
zoomTools.className = 'zoom-tools';
$('actual').replaceChildren($('zoom-value'));
zoomTools.append($('zoom-out'), $('actual'), $('zoom-in'), $('fit'));
mapTools.replaceChildren(relationTools, zoomTools, showDetails);
moreMenu.append();
if (activityEvents.length) {
  mapHeading.firstElementChild.hidden = true;
  mapHeading.prepend($('activity-mode'));
}
document.querySelector('.legend').lastElementChild.before(relationCount);
activityPanel.querySelector('.activity-toolbar').append($('activity-summary'));
const viewModes = { architecture: ['完整架构', 'Architecture', 'layers'], activity: ['更改视图', 'Changes', 'focus'], compare: ['并排对照', 'Compare', 'columns-2'] };
for (const [mode, labels] of Object.entries(viewModes)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.view = mode;
  button.innerHTML = `${icons[labels[2]] || ''}<span>${labels[0]}</span>`;
  button.onclick = () => { activityMode = mode; hoveredModuleId = undefined; updateActivity(); updateFlow(); };
  $('activity-mode').append(button);
}
const activityStep = $('activity-step');
const phaseNames = { planned: ['计划', 'Planned'], editing: ['修改', 'Editing'], verifying: ['验证', 'Verifying'], completed: ['结束', 'Completed'], failed: ['失败', 'Failed'], cancelled: ['取消', 'Cancelled'] };
for (const [id, icon] of Object.entries({ 'activity-prev': 'chevron-left', 'activity-next': 'chevron-right', 'activity-latest': 'skip-forward' })) $(id).innerHTML = icons[icon];
activityStep.onchange = () => { activityIndex = Number(activityStep.value); updateActivity(); };
$('activity-prev').onclick = () => { activityIndex = Math.max(0, activityIndex - 1); updateActivity(); };
$('activity-next').onclick = () => { activityIndex = Math.min(activityEvents.length - 1, activityIndex + 1); updateActivity(); };
$('activity-latest').onclick = () => { activityIndex = activityEvents.length - 1; updateActivity(); };
$('activity-disclosure').ontoggle = () => { if (fitting) updateZoom(); };

// Share authored positions and routes; only the right pane gets activity emphasis.
const mapPanes = document.createElement('div');
mapPanes.className = 'map-panes';
viewport.before(mapPanes);
const changePane = document.createElement('section');
changePane.className = 'map-pane';
changePane.innerHTML = '<h2 class="pane-title" id="change-title"></h2>';
changePane.append(viewport);
mapPanes.append(changePane);
if (activityEvents.length) {
  const overviewPane = document.createElement('section');
  overviewPane.id = 'overview-pane';
  overviewPane.className = 'map-pane';
  overviewPane.hidden = true;
  overviewPane.innerHTML = '<h2 class="pane-title" id="overview-title"></h2><div class="map-scroll" id="overview-scroll"><div id="overview-stage"></div></div>';
  mapPanes.prepend(overviewPane);
  const overview = $('map').cloneNode(true);
  for (const element of [overview, ...overview.querySelectorAll('[id]')]) element.id = `overview-${element.id}`;
  overview.querySelectorAll('[marker-end]').forEach(edge => edge.setAttribute('marker-end', 'url(#overview-arrow)'));
  overview.querySelectorAll('.flow-dot').forEach(dot => dot.remove());
  $('overview-stage').append(overview);
  overview.querySelectorAll('.node').forEach(button => {
    button.onclick = () => {
      if (constraintPanelOpen) { constraintFilter = 'module'; selectedConstraintId = undefined; }
      select(map.modules.find(module => module.id === button.dataset.module)); setInspector(true);
    };
    button.onpointerenter = event => { if (event.pointerType !== 'touch') { hoveredModuleId = button.dataset.module; updateFlow(); } };
    button.onpointerleave = () => { hoveredModuleId = undefined; updateFlow(); };
  });
  for (const [source, destination] of [[viewport, $('overview-scroll')], [$('overview-scroll'), viewport]]) {
    source.addEventListener('scroll', () => {
      if (activityMode !== 'compare') return;
      if (destination.scrollLeft !== source.scrollLeft) destination.scrollLeft = source.scrollLeft;
      if (destination.scrollTop !== source.scrollTop) destination.scrollTop = source.scrollTop;
    });
  }
}
for (const scroll of mapPanes.querySelectorAll('.map-scroll')) {
  scroll.tabIndex = 0;
  let pan;
  scroll.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType === 'touch' || event.target.closest('button')) return;
    pan = { x: event.clientX, y: event.clientY, left: scroll.scrollLeft, top: scroll.scrollTop };
    scroll.setPointerCapture(event.pointerId);
  });
  scroll.addEventListener('pointermove', event => {
    if (!pan) return;
    scroll.scrollLeft = pan.left + pan.x - event.clientX;
    scroll.scrollTop = pan.top + pan.y - event.clientY;
  });
  scroll.addEventListener('lostpointercapture', () => { pan = undefined; });
  scroll.addEventListener('pointerup', event => { pan = undefined; if (scroll.hasPointerCapture(event.pointerId)) scroll.releasePointerCapture(event.pointerId); });
}

function syncOverview() {
  const overview = document.getElementById('overview-map');
  if (!overview) return;
  for (const button of overview.querySelectorAll('.node')) {
    const source = buttons.get(button.dataset.module);
    button.className = source.className;
    button.classList.remove('activity-outside', 'activity-scope', 'activity-target', 'context-muted');
    for (const attr of ['title', 'aria-label', 'aria-pressed']) {
      if (source.hasAttribute(attr)) button.setAttribute(attr, source.getAttribute(attr));
    }
    if (button.innerHTML !== source.innerHTML) button.innerHTML = source.innerHTML;
  }
  overview.querySelectorAll('.group-label').forEach((label, index) => {
    label.textContent = groupFrames[index].label.textContent;
    label.title = groupFrames[index].label.title;
  });
  overview.querySelectorAll('.edge').forEach((edge, index) => {
    edge.setAttribute('class', edges[index].path.getAttribute('class'));
    edge.classList.remove('activity-edge-outside', 'context-muted');
    edge.style.display = edges[index].path.style.display;
    edge.querySelector('title').textContent = edges[index].path.querySelector('title').textContent;
  });
  $('overview-connections').style.setProperty('--flow-accent', $('connections').style.getPropertyValue('--flow-accent'));
}

function updateActivity() {
  const zh = isChinese();
  updateConstraints();
  document.body.classList.toggle('show-activity-context', activityMode === 'activity');
  $('change-title').textContent = viewModes[activityMode === 'architecture' ? 'architecture' : 'activity'][zh ? 0 : 1];
  viewport.setAttribute('aria-label', $('change-title').textContent);
  if (!activityEvents.length) return;
  const event = activityEvents[activityIndex];
  const active = activityMode !== 'architecture';
  const context = $('activity-context');
  // View-state policy: only the changes view owns activity history controls.
  activityPanel.querySelector('.activity-toolbar').hidden = activityMode !== 'activity';
  const terminalPhase = ['completed', 'failed', 'cancelled'].includes(event.phase);
  const targetLabel = terminalPhase ? (zh ? '无当前目标' : 'No current targets') : event.phase === 'planned' ? (zh ? '下一步目标' : 'Next-step targets') : event.phase === 'verifying' ? (zh ? '验证目标' : 'Verification targets') : (zh ? '修改目标' : 'Edit targets');
  mapPanes.classList.toggle('compare', activityMode === 'compare');
  $('overview-pane').hidden = activityMode !== 'compare';
  $('overview-title').textContent = viewModes.architecture[zh ? 0 : 1];
  $('overview-scroll').setAttribute('aria-label', $('overview-title').textContent);
  $('activity-mode').setAttribute('aria-label', zh ? '视图' : 'View');
  for (const button of $('activity-mode').children) {
    const labels = viewModes[button.dataset.view] || viewModes.architecture;
    button.querySelector('span').textContent = labels[zh ? 0 : 1] || labels[0];
    button.setAttribute('aria-pressed', String(button.dataset.view === activityMode));
  }
  activityStep.setAttribute('aria-label', zh ? '活动历史' : 'Activity history');
  activityStep.replaceChildren(...activityEvents.map((record, index) => new Option(`${record.sequence} · ${record.taskId} · ${phaseNames[record.phase][zh ? 0 : 1]}`, String(index))));
  activityStep.value = String(activityIndex);
  for (const [id, labels] of Object.entries({ 'activity-prev': ['上一条', 'Previous record'], 'activity-next': ['下一条', 'Next record'], 'activity-latest': ['最新记录', 'Latest record'] })) $(id).title = $(id).ariaLabel = labels[zh ? 0 : 1];
  $('activity-prev').disabled = activityIndex === 0;
  $('activity-next').disabled = $('activity-latest').disabled = activityIndex === activityEvents.length - 1;
  const source = DATA.simulation ? (zh ? '模拟活动 · 非真实执行' : 'Simulation · no real execution') : (zh ? 'Agent 声明 · 文件快照' : 'Agent-declared · file snapshot');
  $('activity-source').hidden = false;
  $('activity-source').textContent = source;
  document.querySelector('header .simulation').textContent = source;
  const names = ids => ids.map(id => localized(map.modules.find(module => module.id === id), 'name')).join(', ');
  $('activity-summary').textContent = localized(event, 'reason');
  $('activity-context-label').textContent = zh ? '当前修改' : 'Current change';
  $('activity-context-summary').textContent = localized(event, 'reason');
  const contextDetails = $('activity-context-details');
  contextDetails.replaceChildren();
  $('activity-disclosure').querySelector('summary').textContent = `${targetLabel}${terminalPhase ? '' : ` · ${event.targets.length}`} · ${zh ? '详情' : 'Details'}`;
  const details = $('activity-details');
  details.replaceChildren();
  const fields = [
    [zh ? '计划范围' : 'Planned scope', names(event.scope)],
    [targetLabel, terminalPhase ? '-' : names(event.targets)],
    [zh ? '本步骤文件（声明）' : 'Step files (declared)', event.files.join('\n') || '-'],
    [zh ? '未归属文件' : 'Unmapped files', event.unmappedFiles.join('\n') || '-'],
    [zh ? '验证记录' : 'Checks', event.checks.map(check => `${check.command}\n${check.status} · exit ${check.exitCode ?? '-'} · ${localized(check, 'summary')}`).join('\n\n') || (zh ? '未记录验证结果' : 'No checks recorded')]
  ];
  for (const [label, value] of fields) {
    const field = document.createElement('div');
    const heading = document.createElement('strong'); heading.textContent = label;
    const content = document.createElement('div'); content.textContent = value;
    field.append(heading, content); details.append(field);
  }
  const contextFields = [
    [targetLabel, terminalPhase ? '-' : names(event.targets)],
    [zh ? '计划范围' : 'Planned scope', names(event.scope)],
    [zh ? '文件' : 'Files', event.files.join('\n') || '-'],
    [zh ? 'Git 提交' : 'Git commit', event.gitCommit || '-'],
    [zh ? '发生时间' : 'Timestamp', event.timestamp || '-'],
    [zh ? '验证' : 'Checks', event.checks.map(check => `${check.status} · ${localized(check, 'summary')}`).join('\n') || (zh ? '未记录' : 'Not recorded')]
  ];
  for (const [label, value] of contextFields) {
    const field = document.createElement('div');
    const heading = document.createElement('strong'); heading.textContent = label;
    const content = document.createElement('div'); content.textContent = value;
    field.append(heading, content); contextDetails.append(field);
  }
  context.hidden = activityMode !== 'activity';
  $('activity-summary').hidden = $('activity-disclosure').hidden = activityMode !== 'activity';
  for (const [id, button] of buttons) {
    const target = !terminalPhase && event.targets.includes(id);
    button.classList.toggle('activity-outside', active && !target);
    button.classList.toggle('activity-scope', active && event.scope.includes(id));
    button.classList.toggle('activity-target', active && target);
  }
  for (const edge of edges) edge.path.classList.toggle('activity-edge-outside', active &&
    (terminalPhase || !event.targets.includes(edge.relation.from) && !event.targets.includes(edge.relation.to)));
  const legend = document.querySelector('.legend').lastElementChild;
  legend.replaceChildren();
  if (active) {
    for (const [kind, label] of [['planned', zh ? '计划范围' : 'Planned scope'], ['active', targetLabel], ['', zh ? '非当前目标' : 'Other modules']]) {
      const entry = document.createElement('span');
      const swatch = document.createElement('i'); swatch.className = kind;
      entry.append(swatch, document.createTextNode(label)); legend.append(entry);
    }
  } else legend.textContent = source;
  syncOverview();
  updateZoom();
  if (activityMode === 'compare') $('overview-scroll').scrollTo(viewport.scrollLeft, viewport.scrollTop);
}
