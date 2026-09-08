// Orthogonal routing on the free corridors around module rectangles.
function routeArchitecture(relationships, positions) {
  const gap = 10;
  const boxes = [...positions].map(([id, p]) => ({ id, x: p.x, y: p.y, w: 164, h: 72 }));
  const boxById = new Map(boxes.map(b => [b.id, b]));
  const obstacles = boxes.map(b => ({ x: b.x - gap, y: b.y - gap, w: b.w + gap * 2, h: b.h + gap * 2 }));
  const ports = new Map();
  const routes = relationships.map(relation => {
    const from = boxById.get(relation.from), to = boxById.get(relation.to);
    const dx = to.x - from.x, dy = to.y - from.y;
    const sides = from === to ? ['top', 'right'] : Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? ['right', 'left'] : ['left', 'right'])
      : (dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom']);
    return [from, to].map((box, index) => {
      const port = { box, side: sides[index], peer: index ? from : to };
      const key = `${box.id}:${port.side}`;
      if (!ports.has(key)) ports.set(key, []);
      ports.get(key).push(port);
      return port;
    });
  });
  for (const list of ports.values()) {
    const horizontal = ['top', 'bottom'].includes(list[0].side);
    list.sort((a, b) => horizontal ? a.peer.x - b.peer.x : a.peer.y - b.peer.y);
    list.forEach((port, index) => {
      const { box, side } = port;
      const offset = (index + 1) / (list.length + 1);
      port.point = horizontal
        ? [box.x + 16 + (box.w - 32) * offset, box.y + (side === 'bottom' ? box.h : 0)]
        : [box.x + (side === 'right' ? box.w : 0), box.y + 12 + (box.h - 24) * offset];
      port.stub = [port.point[0] + (side === 'left' ? -gap : side === 'right' ? gap : 0),
        port.point[1] + (side === 'top' ? -gap : side === 'bottom' ? gap : 0)];
    });
  }
  const used = [];
  return routes.map(([start, end], routeIndex) => {
    const xs = [...new Set([...obstacles.flatMap(b => [b.x, b.x + b.w]), start.stub[0], end.stub[0]])].sort((a,b) => a-b);
    const ys = [...new Set([...obstacles.flatMap(b => [b.y, b.y + b.h]), start.stub[1], end.stub[1]])].sort((a,b) => a-b);
    const pointAt = id => [xs[id % xs.length], ys[Math.floor(id / xs.length)]];
    const indexOf = p => ys.indexOf(p[1]) * xs.length + xs.indexOf(p[0]);
    const clear = (a, b) => !obstacles.some(r => a[0] === b[0]
      ? a[0] > r.x && a[0] < r.x + r.w && Math.max(a[1], b[1]) > r.y && Math.min(a[1], b[1]) < r.y + r.h
      : a[1] > r.y && a[1] < r.y + r.h && Math.max(a[0], b[0]) > r.x && Math.min(a[0], b[0]) < r.x + r.w);
    const source = indexOf(start.stub), target = indexOf(end.stub);
    const axis = p => p.side === 'left' || p.side === 'right' ? 0 : 1;
    const initial = source * 2 + axis(start);
    const distance = new Map([[initial, 0]]), previous = new Map();
    const queue = [{ state: initial, cost: 0, rank: 0 }];
    let found;
    while (queue.length) {
      queue.sort((a,b) => b.rank - a.rank);
      const current = queue.pop();
      if (current.cost !== distance.get(current.state)) continue;
      const id = Math.floor(current.state / 2), a = pointAt(id);
      if (id === target) { found = current.state; break; }
      const col = id % xs.length, row = Math.floor(id / xs.length);
      const neighbors = [col > 0 ? id - 1 : -1, col + 1 < xs.length ? id + 1 : -1,
        row > 0 ? id - xs.length : -1, row + 1 < ys.length ? id + xs.length : -1];
      for (const next of neighbors) {
        if (next < 0) continue;
        const b = pointAt(next), direction = a[0] === b[0] ? 1 : 0;
        if (!clear(a, b)) continue;
        let penalty = current.state % 2 === direction ? 0 : 18;
        if (next === target && direction !== axis(end)) penalty += 18;
        for (const [c, d] of used) {
          const otherDirection = c[0] === d[0] ? 1 : 0;
          if (direction === otherDirection) {
            const fixed = 1 - direction;
            if (a[fixed] === c[fixed] && Math.min(Math.max(a[direction], b[direction]), Math.max(c[direction], d[direction])) > Math.max(Math.min(a[direction], b[direction]), Math.min(c[direction], d[direction]))) penalty += 60;
          } else if (Math.min(a[0], b[0]) <= Math.max(c[0], d[0]) && Math.max(a[0], b[0]) >= Math.min(c[0], d[0]) && Math.min(a[1], b[1]) <= Math.max(c[1], d[1]) && Math.max(a[1], b[1]) >= Math.min(c[1], d[1])) penalty += 24;
        }
        const cost = current.cost + Math.abs(b[0]-a[0]) + Math.abs(b[1]-a[1]) + penalty;
        const state = next * 2 + direction;
        if (cost >= (distance.get(state) ?? Infinity)) continue;
        distance.set(state, cost); previous.set(state, current.state);
        queue.push({ state, cost, rank: cost + Math.abs(b[0]-end.stub[0]) + Math.abs(b[1]-end.stub[1]) });
      }
    }
    if (found === undefined) throw new Error(`Cannot route ${relationships[routeIndex].from} → ${relationships[routeIndex].to} without crossing a module.`);
    const middle = [];
    for (let state = found; state !== undefined; state = previous.get(state)) middle.push(pointAt(Math.floor(state / 2)));
    const points = [start.point, ...middle.reverse(), end.point];
    for (let i = points.length - 2; i > 0; i--) {
      const [a,b,c] = [points[i-1],points[i],points[i+1]];
      if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) points.splice(i,1);
    }
    for (let i=1;i<points.length;i++) used.push([points[i-1],points[i]]);
    let d = `M ${points[0].join(' ')}`;
    for (let i=1;i<points.length-1;i++) {
      const [a,b,c] = [points[i-1],points[i],points[i+1]];
      const before = Math.hypot(b[0]-a[0],b[1]-a[1]), after = Math.hypot(c[0]-b[0],c[1]-b[1]);
      const radius = Math.min(6,before/2,after/2);
      const entry = b.map((v,k) => v+(a[k]-v)*radius/before);
      const exit = b.map((v,k) => v+(c[k]-v)*radius/after);
      d += ` L ${entry.join(' ')} Q ${b.join(' ')} ${exit.join(' ')}`;
    }
    d += ` L ${points.at(-1).join(' ')}`;
    return { points, d };
  });
}
