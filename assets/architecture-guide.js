// A versioned browser preference, independent of map revisions and activity history.
const guideKey = 'birdview-guide-v1';
const guideLaunch = document.createElement('button');
guideLaunch.id = 'guide-launch';
document.querySelector('.header-actions').append(guideLaunch);
const guideInvite = document.createElement('div');
guideInvite.id = 'guide-invite';
guideInvite.innerHTML = '<span></span><button id="guide-start"></button><button id="guide-dismiss"></button>';
document.querySelector('main').prepend(guideInvite);
try { guideInvite.hidden = localStorage.getItem(guideKey) === 'seen'; } catch {}
const guideDialog = document.createElement('dialog');
guideDialog.id = 'guide-dialog';
guideDialog.setAttribute('aria-labelledby', 'guide-title');
guideDialog.setAttribute('aria-describedby', 'guide-copy');
guideDialog.innerHTML = '<div id="guide-spot" aria-hidden="true"></div><section id="guide-card"><div class="guide-top"><span id="guide-count" aria-live="polite"></span><button id="guide-close">×</button></div><progress id="guide-progress"></progress><h2 id="guide-title"></h2><p id="guide-copy"></p><div class="guide-actions"><button id="guide-prev"></button><button id="guide-skip"></button><button id="guide-next" class="primary"></button></div></section>';
document.body.append(guideDialog);
const guideSteps = activityEvents.length ? ['architecture', 'activity', 'compare', 'details', 'history'] : ['architecture', 'details'];
const guideCopy = {
  architecture: ['完整架构', '了解系统有哪些模块，以及它们如何连接。分组底色表示职责类别，不表示修改状态。', 'Architecture', 'See the system modules and their connections. Group backgrounds classify responsibilities, not change status.'],
  activity: ['本次修改', '亮起的是所选步骤的目标，灰色模块不是当前目标；验证阶段的亮起表示验证目标。终态不再高亮目标。', 'Current changes', 'Bright modules are targets of the selected step; gray modules are not. During verification, highlights mean verification targets. Terminal steps clear highlights.'],
  compare: ['同时对照', '完整架构与更改视图并排展示，选择、缩放和滚动保持联动。窄屏时上下排列。', 'Compare views', 'Compare architecture and changes with linked selection, zoom and scrolling. Narrow screens stack the views.'],
  details: ['查看依据', '点击模块可查看职责、文件归属与源码证据。悬浮模块可追踪直接连接，工具栏可切换全部关系或适配全图。', 'Inspect evidence', 'Select a module for responsibilities, file ownership and source evidence. Hover to trace direct connections; use the toolbar for all relations or fit to view.'],
  history: ['跟踪过程', '历史记录展示计划、编辑和验证步骤。展开详情查看文件和检查结果；任务完成不代表检查通过。', 'Follow progress', 'History shows planning, editing and verification steps. Expand details for files and check results; completion alone does not prove checks passed.']
};
let guideIndex = 0;
let guideSaved;
let guideTarget;
let guideFrame;
const guideViewState = {
  architecture: { mode: 'architecture', inspector: false, history: false },
  activity: { mode: 'activity', inspector: false, history: false },
  compare: { mode: 'compare', inspector: false, history: false },
  details: { mode: 'architecture', inspector: true, history: false },
  history: { mode: 'activity', inspector: false, history: true }
};
function guideLabels() {
  const zh = isChinese();
  guideLaunch.textContent = zh ? '使用指引' : 'Guide';
  guideInvite.querySelector('span').textContent = zh ? '了解怎么看图' : 'Learn to read the map';
  $('guide-start').textContent = zh ? '开始' : 'Start';
  $('guide-dismiss').textContent = zh ? '暂不' : 'Not now';
  for (const [id, labels] of Object.entries({ 'guide-close': ['关闭指引', 'Close guide'], 'guide-prev': ['上一步', 'Previous'], 'guide-skip': ['跳过指引', 'Skip guide'] })) {
    $(id).ariaLabel = labels[zh ? 0 : 1];
    if (id !== 'guide-close') $(id).textContent = labels[zh ? 0 : 1];
  }
  const copy = guideCopy[guideSteps[guideIndex]];
  $('guide-title').textContent = copy[zh ? 0 : 2];
  $('guide-copy').textContent = copy[zh ? 1 : 3];
  $('guide-count').textContent = zh ? `第 ${guideIndex + 1} / ${guideSteps.length} 步` : `Step ${guideIndex + 1} of ${guideSteps.length}`;
  $('guide-progress').max = guideSteps.length;
  $('guide-progress').value = guideIndex + 1;
  $('guide-progress').ariaLabel = $('guide-count').textContent;
  $('guide-prev').disabled = guideIndex === 0;
  $('guide-next').textContent = guideIndex === guideSteps.length - 1 ? (zh ? '完成' : 'Done') : (zh ? '下一步' : 'Next');
}
function positionGuide() {
  if (!guideDialog.open || !guideTarget) return;
  const rect = guideTarget.getBoundingClientRect();
  const w = innerWidth, h = innerHeight;
  const left = Math.max(6, Math.min(w - 12, rect.left - 5));
  const top = Math.max(6, Math.min(h - 12, rect.top - 5));
  const right = Math.max(left + 6, Math.min(w - 6, rect.right + 5));
  const bottom = Math.max(top + 6, Math.min(h - 6, rect.bottom + 5));
  Object.assign($('guide-spot').style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
  const card = $('guide-card');
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let x = left, y = bottom + 14;
  if (y + ch > h - 12) {
    if (top - ch - 14 >= 12) y = top - ch - 14;
    else if (right + cw + 14 < w - 12) { x = right + 14; y = top; }
    else { x = w - cw - 12; y = h - ch - 12; }
  }
  card.style.left = `${Math.max(12, Math.min(w - cw - 12, x))}px`;
  card.style.top = `${Math.max(12, Math.min(h - ch - 12, y))}px`;
}
function showGuideStep() {
  const step = guideSteps[guideIndex];
  const state = guideViewState[step];
  hoveredModuleId = undefined;
  setInspector(state.inspector);
  activityMode = state.mode;
  if (step === 'activity') {
    const plan = activityEvents.findIndex(event => event.phase === 'planned' && event.targets.length);
    activityIndex = plan >= 0 ? plan : guideSaved.index;
  } else activityIndex = guideSaved.index;
  $('activity-disclosure').open = state.history;
  fitting = true;
  updateActivity();
  updateFlow();
  updateZoom();
  if (step === 'details') select(map.modules.find(module => module.id === guideSaved.selected) || map.modules[0]);
  guideTarget = step === 'details' ? inspector : step === 'history' ? activityPanel : step === 'compare' ? $('activity-mode') : step === 'activity' ? viewport : activityEvents.length ? document.querySelector('[data-view="architecture"]') : viewport;
  guideTarget.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  guideLabels();
  positionGuide();
  requestAnimationFrame(positionGuide);
  $('guide-next').focus({ preventScroll: true });
}
function dismissGuideInvite() {
  guideInvite.hidden = true;
  try { localStorage.setItem(guideKey, 'seen'); } catch {}
}
function startGuide() {
  if (guideDialog.open) return;
  dismissGuideInvite();
  guideSaved = { mode: activityMode, index: activityIndex, selected: selectedModuleId, inspector: workspace.classList.contains('inspector-open'), zoom, fitting, disclosure: $('activity-disclosure').open, focus: document.activeElement, x: scrollX, y: scrollY, panes: [...mapPanes.querySelectorAll('.map-scroll')].map(el => [el, el.scrollLeft, el.scrollTop]) };
  guideIndex = 0;
  guideSaved.constraints = { open: constraintPanelOpen, selected: selectedConstraintId, filter: constraintFilter };
  constraintPanelOpen = false;
  guideDialog.showModal();
  showGuideStep();
}
function finishGuide() {
  if (!guideDialog.open) return;
  guideDialog.close();
  activityMode = guideSaved.mode;
  activityIndex = guideSaved.index;
  constraintPanelOpen = guideSaved.constraints.open;
  selectedConstraintId = guideSaved.constraints.selected;
  constraintFilter = guideSaved.constraints.filter;
  fitting = false;
  setInspector(guideSaved.inspector);
  $('activity-disclosure').open = guideSaved.disclosure;
  updateActivity();
  select(map.modules.find(module => module.id === guideSaved.selected) || map.modules[0]);
  zoom = guideSaved.zoom;
  updateZoom();
  fitting = guideSaved.fitting;
  for (const [el, x, y] of guideSaved.panes) el.scrollTo(x, y);
  window.scrollTo(guideSaved.x, guideSaved.y);
  (guideSaved.focus?.isConnected && !guideSaved.focus.closest('#guide-invite') ? guideSaved.focus : guideLaunch).focus({ preventScroll: true });
}
guideLaunch.onclick = $('guide-start').onclick = startGuide;
$('guide-dismiss').onclick = dismissGuideInvite;
$('guide-close').onclick = $('guide-skip').onclick = finishGuide;
$('guide-prev').onclick = () => { if (guideIndex) { guideIndex--; showGuideStep(); } };
$('guide-next').onclick = () => { if (guideIndex === guideSteps.length - 1) finishGuide(); else { guideIndex++; showGuideStep(); } };
guideDialog.addEventListener('cancel', event => { event.preventDefault(); finishGuide(); });
languageSelect.addEventListener('change', () => { guideLabels(); positionGuide(); });
const repositionGuide = () => { cancelAnimationFrame(guideFrame); guideFrame = requestAnimationFrame(positionGuide); };
window.addEventListener('resize', repositionGuide);
document.addEventListener('scroll', repositionGuide, true);
new ResizeObserver(repositionGuide).observe($('guide-card'));
guideLabels();
