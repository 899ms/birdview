const activityEvents = DATA.events || [];
let activityIndex = Math.max(0, activityEvents.length - 1);
const activityPanel = document.createElement('section');
activityPanel.className = 'activity-panel';
activityPanel.hidden = !activityEvents.length;
activityPanel.innerHTML = '<div class="activity-toolbar"><select id="activity-mode"></select><span id="activity-source"></span><select id="activity-step"></select><button id="activity-latest"></button></div><div id="activity-summary" aria-live="polite"></div><div id="activity-details"></div>';
document.querySelector('.task').after(activityPanel);
const activityMode = $('activity-mode');
activityMode.add(new Option('', 'activity'));
activityMode.add(new Option('', 'architecture'));
const activityStep = $('activity-step');
const phaseNames = { planned: ['计划', 'Planned'], editing: ['修改', 'Editing'], verifying: ['验证', 'Verifying'], completed: ['结束', 'Completed'], failed: ['失败', 'Failed'], cancelled: ['取消', 'Cancelled'] };
$('activity-latest').innerHTML = icons['skip-forward'];
activityStep.onchange = () => { activityIndex = Number(activityStep.value); updateActivity(); };
activityMode.onchange = updateActivity;
$('activity-latest').onclick = () => { activityIndex = activityEvents.length - 1; updateActivity(); };
function updateActivity() {
  if (!activityEvents.length) return;
  const zh = isChinese();
  const event = activityEvents[activityIndex];
  const active = activityMode.value === 'activity';
  activityMode.options[0].textContent = zh ? '修改活动' : 'Change activity';
  activityMode.options[1].textContent = zh ? '架构' : 'Architecture';
  activityMode.setAttribute('aria-label', zh ? '视图' : 'View');
  activityStep.setAttribute('aria-label', zh ? '活动历史' : 'Activity history');
  activityStep.replaceChildren(...activityEvents.map((record, index) => new Option(`${record.sequence} · ${record.taskId} · ${phaseNames[record.phase][zh ? 0 : 1]}`, String(index))));
  activityStep.value = String(activityIndex);
  $('activity-latest').title = $('activity-latest').ariaLabel = zh ? '最新记录' : 'Latest record';
  $('activity-latest').disabled = activityIndex === activityEvents.length - 1;
  const source = DATA.simulation ? (zh ? '模拟活动 · 非真实执行' : 'Simulation · no real execution') : (zh ? 'Agent 声明 · 文件快照' : 'Agent-declared · file snapshot');
  $('activity-source').textContent = source;
  document.querySelector('header .simulation').textContent = source;
  const names = ids => ids.map(id => localized(map.modules.find(module => module.id === id), 'name')).join(', ');
  $('activity-summary').textContent = `${event.sequence}/${activityEvents.length} · ${phaseNames[event.phase][zh ? 0 : 1]} · ${event.reason}`;
  const details = $('activity-details');
  details.replaceChildren();
  const fields = [
    [zh ? '计划范围' : 'Planned scope', names(event.scope)],
    [zh ? '本步骤目标' : 'Step targets', names(event.targets) || (zh ? '无' : 'None')],
    [zh ? '本步骤文件（声明）' : 'Step files (declared)', event.files.join('\n') || '-'],
    [zh ? '未归属文件' : 'Unmapped files', event.unmappedFiles.join('\n') || '-'],
    [zh ? '验证记录' : 'Checks', event.checks.map(check => `${check.command}\n${check.status} · exit ${check.exitCode ?? '-'} · ${check.summary}`).join('\n\n') || (zh ? '未记录验证结果' : 'No checks recorded')]
  ];
  for (const [label, value] of fields) {
    const field = document.createElement('div');
    const heading = document.createElement('strong'); heading.textContent = label;
    const content = document.createElement('div'); content.textContent = value;
    field.append(heading, content); details.append(field);
  }
  $('activity-summary').hidden = details.hidden = !active;
  const terminalPhase = ['completed', 'failed', 'cancelled'].includes(event.phase);
  for (const [id, button] of buttons) {
    button.classList.toggle('activity-outside', active && !event.scope.includes(id));
    button.classList.toggle('activity-scope', active && event.scope.includes(id));
    button.classList.toggle('activity-target', active && !terminalPhase && event.phase !== 'planned' && event.targets.includes(id));
  }
  for (const edge of edges) edge.path.classList.toggle('activity-edge-outside', active &&
    !event.scope.includes(edge.relation.from) && !event.scope.includes(edge.relation.to));
  document.querySelector('.legend').lastElementChild.textContent = active
    ? (zh ? '虚线：计划范围 · 亮起：当前目标 · 邻接模块不代表正在修改' : 'Dashed: planned scope · Bright: current targets · Neighbors are not edit targets')
    : source;
  if (fitting) updateZoom();
}
