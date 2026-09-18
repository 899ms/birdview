const constraintRules = map.constraints || [];
let constraintPanelOpen = false;
let selectedConstraintId;
let constraintFilter = 'applicable';
const constraintText = (zh, en) => isChinese() ? zh : en;
const constraintStates = {
  applicable: ['适用', 'Applicable'], superseded: ['已被覆盖', 'Superseded'],
  'not-applicable': ['不适用', 'Not applicable'], uncertain: ['待确认', 'Uncertain'], conflict: ['冲突', 'Conflict'],
  unverified: ['未验证', 'Unverified'], supported: ['有证据支持', 'Evidence-supported'], violated: ['不满足', 'Not satisfied']
};
const constraintButton = document.createElement('button');
constraintButton.id = 'show-constraints';
constraintButton.setAttribute('aria-controls', 'constraints-panel');
mapTools.append(constraintButton);
const moduleContent = document.createElement('div');
moduleContent.id = 'module-content';
moduleContent.append(...[...inspector.children].filter(child => child !== closeDetails));
inspector.append(moduleContent);
const moduleConstraints = document.createElement('section');
moduleConstraints.id = 'module-constraints';
moduleConstraints.className = 'detail';
moduleContent.append(moduleConstraints);
const constraintsPanel = document.createElement('section');
constraintsPanel.id = 'constraints-panel';
constraintsPanel.hidden = true;
inspector.append(constraintsPanel);
constraintButton.onclick = () => {
  constraintPanelOpen = !(constraintPanelOpen && workspace.classList.contains('inspector-open'));
  selectedConstraintId = undefined;
  setInspector(constraintPanelOpen);
  if (constraintPanelOpen) constraintsPanel.querySelector('select')?.focus();
};
showDetails.onclick = () => {
  const open = constraintPanelOpen || !workspace.classList.contains('inspector-open');
  constraintPanelOpen = false;
  selectedConstraintId = undefined;
  setInspector(open);
};
closeDetails.onclick = () => {
  setInspector(false);
  (constraintPanelOpen ? constraintButton : showDetails).focus();
};
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && workspace.classList.contains('inspector-open') && !document.querySelector('dialog[open]')) closeDetails.click();
});

function constraintModules(rule) {
  return new Set([...rule.modules, ...map.relationships.filter(relation => rule.relationships.includes(relation.id)).flatMap(relation => [relation.from, relation.to])]);
}

function constraintApplies(rule, event) {
  if (rule.applicability !== 'applicable') return false;
  if (rule.scope === 'task') return event?.taskId === rule.taskId;
  return !event || rule.scope === 'project' || [...constraintModules(rule)].some(id => event.scope.includes(id));
}

function updateConstraints() {
  const event = activityMode === 'architecture' ? undefined : activityEvents[activityIndex];
  const applicable = constraintRules.filter(rule => constraintApplies(rule, event));
  const open = constraintPanelOpen && workspace.classList.contains('inspector-open');
  constraintButton.innerHTML = icons['shield-check'];
  const buttonLabel = document.createElement('span');
  buttonLabel.textContent = `${constraintText('约束', 'Constraints')} · ${applicable.length}`;
  constraintButton.append(buttonLabel);
  const attention = constraintRules.filter(rule => ['uncertain', 'conflict'].includes(rule.applicability)).length;
  if (attention) {
    const count = document.createElement('span');
    count.className = 'constraint-attention-count';
    count.textContent = String(attention);
    count.title = constraintText(`${attention} 条待确认或冲突规则`, `${attention} uncertain or conflicting rules`);
    count.ariaLabel = count.title;
    constraintButton.append(count);
  }
  constraintButton.title = constraintButton.ariaLabel = constraintText('查看约束与来源', 'Inspect constraints and sources');
  constraintButton.setAttribute('aria-expanded', String(open));
  workspace.classList.toggle('constraints-open', open);
  moduleContent.hidden = constraintPanelOpen;
  constraintsPanel.hidden = !constraintPanelOpen;
  moduleConstraints.replaceChildren();
  const moduleHeading = document.createElement('div');
  moduleHeading.className = 'field-label';
  moduleHeading.textContent = constraintText('适用约束', 'Applicable constraints');
  moduleConstraints.append(moduleHeading);
  const moduleRules = applicable.filter(rule => ['project', 'task'].includes(rule.scope) || constraintModules(rule).has(selectedModuleId));
  for (const rule of moduleRules) {
    const button = document.createElement('button');
    button.className = 'constraint-module-link';
    button.textContent = localized(rule, 'name');
    button.onclick = () => {
      selectedConstraintId = rule.id; constraintPanelOpen = true; setInspector(true);
      constraintsPanel.querySelector(`[data-constraint="${rule.id}"]`)?.focus();
    };
    moduleConstraints.append(button);
  }
  if (!moduleRules.length) {
    const empty = document.createElement('p');
    empty.textContent = constraintText('未记录适用约束', 'No applicable constraints recorded');
    moduleConstraints.append(empty);
  }
  constraintsPanel.replaceChildren();
  const eyebrow = document.createElement('div');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = constraintText('规则与依据', 'RULES & EVIDENCE');
  const heading = document.createElement('h2');
  heading.textContent = constraintText('约束', 'Constraints');
  const context = document.createElement('p');
  context.className = 'constraint-context';
  context.textContent = event ? `${event.taskId} · ${constraintText('步骤', 'Step')} ${event.sequence}` : constraintText('项目架构快照', 'Project architecture snapshot');
  constraintsPanel.append(eyebrow, heading, context);
  const discovery = document.createElement('details');
  discovery.className = 'constraint-discovery';
  const discoverySummary = document.createElement('summary');
  discoverySummary.textContent = map.constraintDiscovery
    ? `${constraintText('已检查', 'Inspected')} ${map.constraintDiscovery.checkedPaths.length} · ${constraintText('未检查', 'Uninspected')} ${map.constraintDiscovery.uninspectedPaths.length}`
    : constraintText('未记录本地约束检查', 'Local constraint discovery not recorded');
  discovery.append(discoverySummary);
  if (map.constraintDiscovery) {
    const details = document.createElement('p');
    details.textContent = `${map.constraintDiscovery.checkedAt}\n${constraintText('已检查', 'Inspected')}: ${map.constraintDiscovery.checkedPaths.join(', ') || '—'}\n${constraintText('未检查', 'Uninspected')}: ${map.constraintDiscovery.uninspectedPaths.join(', ') || '—'}`;
    discovery.append(details);
  }
  constraintsPanel.append(discovery);
  const filter = document.createElement('select');
  filter.id = 'constraint-filter';
  filter.ariaLabel = constraintText('约束筛选', 'Filter constraints');
  for (const [value, zh, en] of [['applicable', '本次适用', 'Applicable'], ['module', '选中模块', 'Selected module'], ['attention', '待确认与冲突', 'Uncertain & conflicting'], ['all', '全部规则', 'All rules']]) filter.add(new Option(constraintText(zh, en), value));
  filter.value = constraintFilter;
  filter.onchange = () => { constraintFilter = filter.value; selectedConstraintId = undefined; updateConstraints(); $('constraint-filter').focus(); };
  constraintsPanel.append(filter);
  const visible = constraintRules.filter(rule => constraintFilter === 'all' ||
    (constraintFilter === 'attention' ? ['uncertain', 'conflict'].includes(rule.applicability) :
      constraintFilter === 'module' ? applicable.includes(rule) && (['project', 'task'].includes(rule.scope) || constraintModules(rule).has(selectedModuleId)) : applicable.includes(rule)));
  const selected = constraintRules.find(rule => rule.id === selectedConstraintId);
  if (selected && !visible.includes(selected)) visible.unshift(selected);
  const list = document.createElement('div');
  list.className = 'constraint-list';
  for (const rule of visible) {
    const row = document.createElement('button');
    row.className = 'constraint-row';
    row.dataset.constraint = rule.id;
    row.setAttribute('aria-pressed', String(rule.id === selectedConstraintId));
    const meta = document.createElement('span');
    meta.className = 'constraint-row-meta';
    meta.textContent = `${rule.origin === 'local' ? constraintText('本地规范', 'Local rule') : rule.origin === 'user' ? constraintText('用户要求', 'User request') : constraintText('代码推断', 'Inferred')} · ${rule.strength === 'required' ? constraintText('硬性要求', 'Required') : constraintText('偏好', 'Preferred')}`;
    const name = document.createElement('strong');
    name.textContent = localized(rule, 'name');
    const state = document.createElement('span');
    state.className = 'constraint-state';
    state.dataset.state = rule.applicability;
    state.textContent = constraintStates[rule.applicability][isChinese() ? 0 : 1];
    const review = event?.constraintReviews?.find(item => item.constraintId === rule.id);
    state.dataset.result = review?.status || 'unverified';
    if (event && applicable.includes(rule)) state.textContent += ` · ${constraintStates[review?.status || 'unverified'][isChinese() ? 0 : 1]}`;
    row.append(meta, name, state);
    row.onclick = () => { selectedConstraintId = selectedConstraintId === rule.id ? undefined : rule.id; updateConstraints(); constraintsPanel.querySelector(`[data-constraint="${rule.id}"]`)?.focus(); };
    list.append(row);
    if (rule.id === selectedConstraintId) {
      const detail = document.createElement('div');
      detail.className = 'constraint-detail';
      const field = (label, value) => {
        const title = document.createElement('h3'); title.textContent = label;
        const content = document.createElement('p'); content.textContent = value;
        detail.append(title, content);
      };
      field(constraintText('适用依据', 'Applicability'), localized(rule, 'note'));
      const names = [...constraintModules(rule)].map(id => localized(map.modules.find(module => module.id === id), 'name'));
      field(constraintText('作用范围', 'Scope'), names.join(' · ') || (rule.scope === 'task' ? rule.taskId : constraintText('整个项目', 'Project-wide')));
      for (const source of rule.evidence) {
        const sourceDetails = document.createElement('details');
        sourceDetails.className = 'constraint-source';
        const location = document.createElement('summary');
        location.textContent = `${source.path}${source.line ? `:${source.line}${source.endLine ? `–${source.endLine}` : ''}` : ''}${source.symbol ? ` · ${source.symbol}` : ''}`;
        const quote = document.createElement('p'); quote.textContent = localized(source, 'note');
        sourceDetails.append(location, quote); detail.append(sourceDetails);
      }
      for (const id of [rule.supersededBy, ...(rule.conflictsWith || [])].filter(Boolean)) {
        const linked = constraintRules.find(item => item.id === id);
        const link = document.createElement('button'); link.className = 'constraint-module-link';
        link.textContent = `${constraintText('关联规则', 'Related rule')}: ${localized(linked, 'name')}`;
        link.onclick = () => { selectedConstraintId = id; constraintFilter = 'all'; updateConstraints(); };
        detail.append(link);
      }
      field(constraintText('验证方式', 'Verification'), localized(rule, 'verification'));
      if (event && applicable.includes(rule)) {
        field(constraintText('本次方案', 'Task plan'), review ? localized(review, 'plan') : constraintText('未记录', 'Not recorded'));
        field(constraintText('验证结果', 'Result'), `${constraintStates[review?.status || 'unverified'][isChinese() ? 0 : 1]}${review ? ` · ${review.method === 'test' ? constraintText('测试', 'Test') : constraintText('人工核对', 'Manual review')}` : ''}`);
        if (review?.evidence) field(constraintText('结果依据', 'Result evidence'), localized(review, 'evidence'));
        for (const index of review?.checkIndexes || []) {
          const check = event.checks[index];
          field(check.command, `${check.status} · exit ${check.exitCode ?? '—'}\n${localized(check, 'summary')}`);
        }
      }
      list.append(detail);
    }
  }
  if (!visible.length) {
    const empty = document.createElement('p'); empty.className = 'constraint-empty';
    empty.textContent = constraintText('此范围未记录约束', 'No constraints recorded in this scope'); list.append(empty);
  }
  constraintsPanel.append(list);
  const highlighted = open && selected ? constraintModules(selected) : new Set();
  for (const [id, button] of buttons) button.classList.toggle('constraint-highlight', highlighted.has(id));
  for (const edge of edges) edge.path.classList.toggle('constraint-highlight', Boolean(open && selected?.relationships.includes(edge.relation.id)));
  updateFlow();
}
