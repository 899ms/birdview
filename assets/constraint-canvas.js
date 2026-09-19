// Birdview's constraint canvas. No external runtime or copied frontend components.
function mountConstraintCanvas(container, data) {
  const root = container;
  root.classList.add('bv-constraints');
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const text = (zh, en) => document.documentElement.lang.startsWith('zh') ? zh : en;
  const button = (className, label, action) => {
    const node = element('button', className, label);
    node.type = 'button'; node.onclick = action; return node;
  };
  const nodes = new Map(data.nodes.map(node => [node.id, node]));
  const children = new Map(data.nodes.map(node => [node.id, []]));
  for (const node of data.nodes) if (node.parent) children.get(node.parent)?.push(node.id);
  const top = data.nodes.find(node => !node.parent).id;
  const expanded = new Set([top]);
  let selected = top, filterIds = null, query = '', matching = null, searchMessage = '';
  let positions = new Map(), visible = [], camera = { x: 0, y: 0, scale: 1 }, fitted = false;
  let directoryOpen = !matchMedia('(max-width:700px)').matches;
  const toolbar = element('div', 'cv-toolbar');
  const toggleDirectory = button('cv-directory-toggle', '☰', () => {
    directoryOpen = !directoryOpen; directory.hidden = !directoryOpen;
    toggleDirectory.setAttribute('aria-expanded', String(directoryOpen));
    if (directoryOpen) search.focus();
  });
  const title = element('span', 'cv-title');
  const resetFilter = button('cv-reset-filter', '', () => api.filter(null));
  const zoomOut = button('cv-zoom-out', '−', () => zoomAt(camera.scale / 1.2));
  const zoomLabel = element('span', 'cv-zoom-label');
  const zoomIn = button('cv-zoom-in', '+', () => zoomAt(camera.scale * 1.2));
  const fitButton = button('cv-fit', '', () => fit());
  const legendButton = button('cv-legend-toggle', '', () => {
    legend.hidden = !legend.hidden; legendButton.setAttribute('aria-expanded', String(!legend.hidden));
  });
  const coverageButton = button('cv-coverage', '', () => { selected = top; showDetails(top); render(); });
  toolbar.append(toggleDirectory, title, resetFilter, zoomOut, zoomLabel, zoomIn, fitButton, legendButton, coverageButton);
  if (data.sourceHref && !/^\s*(?:javascript|data|vbscript):/i.test(data.sourceHref)) {
    const link = element('a', 'cv-sources'); link.href = data.sourceHref; link.target = '_blank'; link.rel = 'noopener'; toolbar.append(link);
  }
  const workspace = element('div', 'cv-workspace');
  const directory = element('nav', 'cv-directory'); directory.hidden = !directoryOpen;
  const directoryHeading = element('div', 'cv-directory-heading');
  const directoryTitle = element('span');
  const directoryClose = button('', '×', () => { directoryOpen = false; directory.hidden = true; toggleDirectory.setAttribute('aria-expanded', 'false'); toggleDirectory.focus(); });
  directoryHeading.append(directoryTitle, directoryClose);
  const search = element('input', 'cv-search'); search.type = 'search'; search.autocomplete = 'off';
  const tree = element('div', 'cv-tree');
  const empty = element('div', 'cv-empty'); empty.setAttribute('role', 'status');
  directory.append(directoryHeading, search, tree, empty);
  const viewport = element('div', 'cv-viewport'); viewport.tabIndex = 0;
  const stage = element('div', 'cv-stage');
  const help = element('span', 'cv-help');
  viewport.append(stage, help);
  const reader = element('section', 'cv-reader'); reader.hidden = true;
  const readerHeader = element('div', 'cv-reader-header');
  const readerTitle = element('h2', 'cv-reader-title');
  const readerClose = button('cv-reader-close', '×', () => {
    reader.hidden = true; focusSelected(); focusButton();
  });
  const readerMeta = element('p', 'cv-reader-meta');
  const readerBody = element('div', 'cv-reader-body');
  readerHeader.append(readerTitle, readerClose); reader.append(readerHeader, readerMeta, readerBody);
  workspace.append(directory, viewport, reader);
  const legend = element('section', 'cv-legend'); legend.hidden = true;
  root.append(toolbar, workspace, legend);

  function allowed(id) { return (!filterIds || filterIds.has(id)) && (!matching || matching.has(id)); }
  function visibleChildren(id) { return (children.get(id) || []).filter(allowed); }
  function ancestors(id, set) {
    for (let node = nodes.get(id); node; node = nodes.get(node.parent)) set.add(node.id);
  }
  function roleStyle(node, target) {
    const role = data.roles?.[node.role || 'generic'];
    if (!role) return;
    // Both palettes are owned by Birdview; colors encode role, never compliance.
    const light = document.documentElement.dataset.theme === 'light';
    const colors = light ? role.light : role.dark;
    ['accent', 'bg', 'border'].forEach((key, index) => target.style.setProperty(`--cv-role-${key}`, colors[index]));
  }
  function label(node) {
    if (node.kind === 'rule') {
      const role = data.roles[node.role || 'generic'];
      const en = { frontend: 'Frontend', backend: 'Backend', cache: 'Cache', database: 'Data store', queue: 'Tasks / Queue', security: 'Security', generic: 'Generic' };
      return `R${String(node.ordinal).padStart(3, '0')} · ${node.version ? 'v' + node.version : text('版本未追踪', 'Untracked')} · ${text(role.name, en[node.role || 'generic'])}`;
    }
    if (filterIds || matching) return text('筛选范围', 'Filtered scope');
    return node.label || node.desc;
  }
  function applyCamera() {
    stage.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    zoomLabel.textContent = `${Math.round(camera.scale * 100)}%`;
    zoomOut.disabled = camera.scale <= .15; zoomIn.disabled = camera.scale >= 2;
  }
  function zoomAt(scale, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
    const next = Math.max(.15, Math.min(2, scale)), ratio = next / camera.scale;
    camera.x = x - (x - camera.x) * ratio; camera.y = y - (y - camera.y) * ratio; camera.scale = next; applyCamera();
  }
  function fit() {
    if (!positions.size || viewport.clientWidth < 1 || viewport.clientHeight < 1) return;
    const width = Math.max(...[...positions.values()].map(p => p.x)) + 210;
    const height = Math.max(...[...positions.values()].map(p => p.y)) + 76;
    camera.scale = Math.max(.01, Math.min(1, (viewport.clientWidth - 80) / width, (viewport.clientHeight - 100) / height));
    camera.x = (viewport.clientWidth - width * camera.scale) / 2;
    camera.y = (viewport.clientHeight - height * camera.scale) / 2;
    fitted = true; applyCamera();
  }
  function focusSelected() {
    const point = positions.get(selected); if (!point) return;
    camera.x = viewport.clientWidth / 2 - (point.x + 105) * camera.scale;
    camera.y = viewport.clientHeight / 2 - (point.y + 38) * camera.scale; applyCamera();
  }
  function focusButton() {
    [...stage.querySelectorAll('.cv-card')].find(node => node.dataset.id === selected)?.focus({ preventScroll: true });
  }
  function activate(id, fromDirectory = false) {
    const prior = positions.get(id);
    const screen = prior && { x: camera.x + prior.x * camera.scale, y: camera.y + prior.y * camera.scale };
    selected = id;
    const descendants = visibleChildren(id);
    if (descendants.length && !query) expanded.has(id) ? expanded.delete(id) : expanded.add(id);
    if (!descendants.length) showDetails(id);
    render();
    if (screen && !fromDirectory && reader.hidden) {
      const point = positions.get(id);
      camera.x = screen.x - point.x * camera.scale; camera.y = screen.y - point.y * camera.scale; applyCamera();
    } else focusSelected();
    if (fromDirectory && matchMedia('(max-width:700px)').matches) {
      directoryOpen = false; directory.hidden = true; toggleDirectory.setAttribute('aria-expanded', 'false'); focusSelected();
    }
    if (!fromDirectory || !reader.hidden) focusButton();
  }
  // Only render basic document structure. Source text is never inserted as HTML.
  function showDetails(id) {
    const node = nodes.get(id); reader.hidden = false; reader.scrollTop = 0;
    readerTitle.textContent = node.title; readerMeta.textContent = label(node);
    readerBody.replaceChildren();
    const body = data.documents[id]?.body || node.desc || '';
    let code = null, quote = null;
    for (const line of body.split('\n')) {
      if (line.startsWith('```')) { if (code) code = null; else { code = element('pre'); readerBody.append(code); } continue; }
      if (code) { code.textContent += line + '\n'; continue; }
      if (line.startsWith('# ')) continue;
      if (line.startsWith('> ')) {
        if (!quote) { quote = element('blockquote'); readerBody.append(quote); }
        quote.textContent += (quote.textContent ? '\n' : '') + line.slice(2); continue;
      }
      quote = null;
      if (!line.trim()) continue;
      const heading = line.match(/^#{2,6}\s+(.*)/);
      readerBody.append(element(heading ? 'h3' : 'p', '', heading ? heading[1] : line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')));
    }
  }
  function render() {
    positions = new Map(); visible = [];
    let cursor = 0;
    // Each subtree occupies its own leaf interval, so siblings never overlap.
    function place(id, depth) {
      if (!allowed(id)) return;
      visible.push(id);
      const list = (query || expanded.has(id)) ? visibleChildren(id) : [];
      let y;
      if (list.length) {
        for (const child of list) place(child, depth + 1);
        y = (positions.get(list[0]).y + positions.get(list.at(-1)).y) / 2;
      } else { y = cursor; cursor += 96; }
      positions.set(id, { x: depth * 290, y });
    }
    place(top, 0);
    const path = new Set(); ancestors(selected, path);
    stage.replaceChildren(); tree.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('cv-edges'); svg.setAttribute('aria-hidden', 'true'); stage.append(svg);
    for (const id of visible) {
      const node = nodes.get(id), point = positions.get(id), parent = positions.get(node.parent);
      if (parent) {
        const edge = document.createElementNS(svg.namespaceURI, 'path');
        const x1 = parent.x + 210, y1 = parent.y + 38, x2 = point.x, y2 = point.y + 38;
        edge.setAttribute('d', `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`);
        edge.classList.add('cv-edge'); if (path.has(id)) edge.classList.add('cv-relevant'); svg.append(edge);
      }
      const card = button('cv-card', '', () => activate(id)); card.dataset.id = id;
      card.style.left = point.x + 'px'; card.style.top = point.y + 'px'; roleStyle(node, card);
      card.title = node.title + '\n' + node.desc; card.setAttribute('aria-current', String(selected === id));
      const cardTitle = element('span', 'cv-card-title'); cardTitle.append(element('i', 'cv-dot'), element('span', '', node.title));
      card.append(cardTitle, element('span', 'cv-card-meta', label(node)));
      const list = visibleChildren(id);
      if (list.length) {
        card.setAttribute('aria-expanded', String(!!query || expanded.has(id)));
        card.append(element('span', 'cv-expand-count', `${expanded.has(id) || query ? '−' : '+'}${list.length}`));
      }
      card.onkeydown = event => {
        if (event.key === 'ArrowRight' && list.length) { event.preventDefault(); expanded.add(id); selected = list[0]; render(); focusSelected(); focusButton(); }
        if (event.key === 'ArrowLeft' && node.parent) { event.preventDefault(); selected = node.parent; render(); focusSelected(); focusButton(); }
      };
      stage.append(card);
      const row = button('cv-tree-row', '', () => activate(id, true)); row.dataset.id = id;
      row.style.paddingLeft = (8 + point.x / 290 * 12) + 'px';
      row.setAttribute('aria-current', String(selected === id));
      if (list.length) row.setAttribute('aria-expanded', String(!!query || expanded.has(id)));
      row.append(element('span', 'cv-tree-marker', list.length ? (expanded.has(id) || query ? '▾' : '▸') : '·'), element('span', '', node.title));
      tree.append(row);
    }
    empty.hidden = !searchMessage && visible.length > 0;
    empty.textContent = searchMessage || text('没有匹配的规则', 'No matching rules');
    applyCamera();
  }
  function searchNodes() {
    query = search.value.trim().toLocaleLowerCase(); matching = null; searchMessage = '';
    if (query) {
      matching = new Set(); let count = 0;
      for (const node of data.nodes) {
        if (filterIds && !filterIds.has(node.id)) continue;
        const body = node.kind === 'group' ? '' : data.documents[node.id]?.body;
        if (![node.title, node.desc, body].join(' ').toLocaleLowerCase().includes(query)) continue;
        count++;
        if (count <= 100) ancestors(node.id, matching);
      }
      if (count > 100) searchMessage = text(`找到 ${count} 项，显示前 100 项；请缩小搜索范围。`, `${count} matches; showing the first 100. Refine your search.`);
    }
    render(); fit();
  }
  search.oninput = searchNodes;
  let gesture = null, moved = false;
  const pointers = new Map();
  viewport.onpointerdown = event => {
    if (event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); moved = false;
    if (pointers.size === 1) gesture = { x: event.clientX, y: event.clientY, camera: { ...camera } };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]; gesture = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: camera.scale };
    }
    if (!event.target.closest('button')) viewport.setPointerCapture(event.pointerId);
  };
  viewport.onpointermove = event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && gesture?.distance) {
      const [a, b] = [...pointers.values()], rect = viewport.getBoundingClientRect();
      zoomAt(gesture.scale * Math.hypot(a.x - b.x, a.y - b.y) / gesture.distance, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top); moved = true;
    } else if (gesture?.camera) {
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (Math.hypot(dx, dy) > 4) moved = true;
      if (moved) { viewport.setPointerCapture(event.pointerId); camera.x = gesture.camera.x + dx; camera.y = gesture.camera.y + dy; applyCamera(); }
    }
  };
  const release = event => { pointers.delete(event.pointerId); gesture = null; };
  viewport.onpointerup = release; viewport.onpointercancel = release;
  viewport.addEventListener('click', event => { if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; } }, true);
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) { const rect = viewport.getBoundingClientRect(); zoomAt(camera.scale * Math.exp(-event.deltaY * .003), event.clientX - rect.left, event.clientY - rect.top); }
    else { camera.x -= event.deltaX; camera.y -= event.deltaY; applyCamera(); }
  }, { passive: false });
  viewport.onkeydown = event => {
    if (event.target !== viewport) return;
    if (event.key === '+' || event.key === '=') zoomAt(camera.scale * 1.2);
    if (event.key === '-') zoomAt(camera.scale / 1.2);
    if (event.key === '0') fit();
    const shifts = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
    if (shifts[event.key]) { event.preventDefault(); camera.x += shifts[event.key][0]; camera.y += shifts[event.key][1]; applyCamera(); }
  };
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!legend.hidden) { legend.hidden = true; legendButton.setAttribute('aria-expanded', 'false'); legendButton.focus(); }
    else if (!reader.hidden) readerClose.click();
    else if (!directory.hidden && matchMedia('(max-width:700px)').matches) directoryClose.click();
  });
  const api = {
    filter(ids) {
      filterIds = ids ? new Set() : null;
      for (const id of ids || []) ancestors(id, filterIds);
      selected = top; expanded.clear(); expanded.add(top); reader.hidden = true; search.value = ''; query = ''; matching = null; searchMessage = '';
      resetFilter.hidden = !filterIds; render(); fit(); refreshLabels();
    },
    refresh() { const scroll = reader.scrollTop; refreshLabels(); render(); if (!reader.hidden) { showDetails(selected); reader.scrollTop = scroll; } },
    resize() { if (!fitted && viewport.clientWidth > 0) fit(); }
  };
  function refreshLabels() {
    title.textContent = filterIds ? text('模块关联规则', 'Module-linked rules') : data.mode === 'sources' ? text('来源索引 · 未完成语义审查', 'Source index · Semantic review pending') : text('已整理规则', 'Reviewed rules') + ` · ${data.nodes.filter(node => node.kind === 'rule').length}`;
    title.title = data.scope;
    toggleDirectory.title = toggleDirectory.ariaLabel = text('规则目录', 'Rule directory'); toggleDirectory.setAttribute('aria-expanded', String(directoryOpen));
    directoryTitle.textContent = data.mode === 'sources' ? text('来源目录', 'Sources') : text('规则目录', 'Rules'); directory.setAttribute('aria-label', directoryTitle.textContent);
    directoryClose.ariaLabel = text('收起目录', 'Close directory');
    search.placeholder = text('搜索规则与原文', 'Search rules and sources'); search.ariaLabel = search.placeholder;
    resetFilter.textContent = text('查看全部规则', 'Show all rules'); resetFilter.hidden = !filterIds;
    fitButton.textContent = text('适配全图', 'Fit graph');
    zoomIn.ariaLabel = text('放大', 'Zoom in'); zoomOut.ariaLabel = text('缩小', 'Zoom out');
    legendButton.textContent = text('角色图例', 'Role legend'); legendButton.hidden = !data.roles; legendButton.setAttribute('aria-expanded', String(!legend.hidden));
    coverageButton.textContent = text('阅读范围', 'Coverage');
    readerClose.ariaLabel = text('关闭详情', 'Close details');
    viewport.ariaLabel = text('约束图画布；方向键平移，加减键缩放，0 适配', 'Constraint canvas; arrows to pan, plus/minus to zoom, 0 to fit');
    help.textContent = text('拖动平移 · Ctrl + 滚轮缩放 · 选择规则阅读详情', 'Drag to pan · Ctrl + scroll to zoom · Select a rule to read');
    const link = toolbar.querySelector('.cv-sources'); if (link) link.textContent = text('来源索引 ↗', 'Sources ↗');
    legend.replaceChildren(element('strong', '', text('适用角色', 'Applicable roles')));
    const en = { frontend: 'Frontend', backend: 'Backend', cache: 'Cache', database: 'Data store', queue: 'Tasks / Queue', security: 'Security', generic: 'Generic' };
    for (const [id, role] of Object.entries(data.roles || {})) {
      const row = element('div', 'cv-legend-row'); roleStyle({ role: id }, row);
      row.append(element('i', 'cv-dot'), element('span', '', text(role.name, en[id])), element('b', '', String(data.nodes.filter(node => node.kind === 'rule' && (node.role || 'generic') === id && (!filterIds || filterIds.has(node.id))).length))); legend.append(row);
    }
    legend.append(element('p', '', text('编号分主题，颜色分角色，不代表合规结果。通用含跨角色与未明确归属。', 'Numbers identify topics; colors identify roles, not compliance. Generic includes mixed or unknown roles.')),
      element('p', '', text('规则原文版本与项目快照分别记录。实现尚未核验。', 'Source-range versions and project snapshot are separate. Implementation is unverified.')),
      element('p', '', data.revision));
  }
  const resizeObserver = new ResizeObserver(() => api.resize()); resizeObserver.observe(viewport);
  const themeObserver = new MutationObserver(() => api.refresh()); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
  refreshLabels(); render(); requestAnimationFrame(() => api.resize());
  return api;
}
