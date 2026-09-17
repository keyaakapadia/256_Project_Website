/* ------------------------------------------------------------------
   Loom — the engine, shared by both landing-page drafts.

   Every picture carries one or two of nine things a grid can do.
   A line joins two pictures that share something; its colour says
   which of the nine, and a line that changes colour crossed from one
   meaning into another. That is the whole legend: the lines ARE the
   meanings of the grids.

   A view decides the shape the pictures are laid into.
   A sort decides the order they are laid in.
   The two are independent, so every pairing is a real arrangement.

   Loads after ../assets/loom.js, which defines DATA and META.
------------------------------------------------------------------ */
(function (global) {
'use strict';

const N = DATA.length, TILE = META.tile, GOLD = META.gold;

/* ---------- views and sorts ---------- */
const VIEWS = {
  nodes:    { label: 'Nodes',    dist: 10300 },
  timeline: { label: 'Timeline', dist: 8600  },
  clusters: { label: 'Clusters', dist: 10600 },
  grid:     { label: 'Grid',     dist: 10600 },
  sphere:   { label: 'Sphere',   dist: 6400  }
};
const VIEW_ORDER = ['nodes', 'timeline', 'clusters', 'grid', 'sphere'];
const SORTS = { colour: 'Colour', meaning: 'Meaning', freq: 'Frequency' };
const SORT_ORDER = ['colour', 'meaning', 'freq'];
const SORT_NOTE = {
  colour: 'neutrals first, then round the wheel',
  meaning: 'grouped by what the grid does',
  freq: 'seen every day first, rarest last'
};
const ICON = {
  nodes:    '<circle cx="5" cy="6" r="1.6"/><circle cx="13" cy="4" r="1.6"/><circle cx="9" cy="11" r="1.6"/><circle cx="16" cy="13" r="1.6"/><circle cx="4" cy="15" r="1.6"/>',
  timeline: '<path d="M3 10h14"/><path d="M5 7v6M9 5.5v9M13 7.5v5M16.5 6.5v7"/>',
  clusters: '<circle cx="6" cy="6" r="2.6"/><circle cx="14.5" cy="5.5" r="2"/><circle cx="6.5" cy="14.5" r="2"/><circle cx="14" cy="14" r="2.6"/>',
  grid:     '<rect x="3" y="3" width="5.5" height="5.5"/><rect x="11.5" y="3" width="5.5" height="5.5"/><rect x="3" y="11.5" width="5.5" height="5.5"/><rect x="11.5" y="11.5" width="5.5" height="5.5"/>',
  sphere:   '<circle cx="10" cy="10" r="7"/><ellipse cx="10" cy="10" rx="3.2" ry="7"/><path d="M3 10h14"/>'
};

/* ---------- colour families, for reading a colour sort ---------- */
const FAMILY = [[15,'red'],[45,'orange'],[70,'yellow'],[160,'green'],[200,'cyan'],
                [255,'blue'],[290,'violet'],[335,'magenta'],[361,'red']];
const familyOf = d => d.sat < 8 ? 'neutral' : FAMILY.find(f => d.hue < f[0])[1];

const MIDX = {}; META.meanings.forEach((m, i) => MIDX[m] = i);
const FMIN = Math.min.apply(null, DATA.map(d => d.freq));
const FMAX = Math.max.apply(null, DATA.map(d => d.freq));
const fnorm = d => (d.freq - FMIN) / (FMAX - FMIN || 1);

/* the colour a picture is filed under, for the strip beneath the ribbon */
function sortColour(i, sort){
  const d = DATA[i];
  if (sort === 'colour')  return d.hex;
  if (sort === 'meaning') return META.mcol[d.means[0]];
  const g = Math.round(210 - fnorm(d) * 150);
  return '#' + ((g << 16 | g << 8 | g) | 0x1000000).toString(16).slice(1);
}

function order(sort){
  const idx = DATA.map((_, i) => i);
  if (sort === 'colour')
    idx.sort((a, b) => {
      const A = DATA[a], B = DATA[b], na = A.sat < 8, nb = B.sat < 8;
      if (na !== nb) return na ? -1 : 1;        /* the greys run first, as a ramp */
      if (na) return A.lit - B.lit;
      return A.hue - B.hue || A.lit - B.lit;
    });
  else if (sort === 'meaning')
    idx.sort((a, b) => MIDX[DATA[a].means[0]] - MIDX[DATA[b].means[0]] || DATA[b].deg - DATA[a].deg);
  else
    idx.sort((a, b) => DATA[a].freq - DATA[b].freq || DATA[b].deg - DATA[a].deg);
  return idx;
}

/* ---------- the five shapes ----------
   Each returns positions plus the columns it was built from, so the
   guides drawn underneath are the real structure, not decoration. */
/* 15 x 10 so all 150 fit the screen at once at the view's own distance —
   the whole run is the point of a timeline, not a slice of it */
const TL_COLS = 15, TL_CW = 380, TL_RH = 380;
const GRID_TOP = -1400, G_CW = 300, G_RH = 255, G_GAP = 165;
const CL_CW = 275, CL_RH = 235;

function layout(view, sort){
  const ord = order(sort), out = new Array(N), cols = [];

  if (view === 'nodes'){
    ord.forEach((i, k) => {
      /* phyllotaxis: 210 keeps all 150 inside the room left beside the panel
         at this view's distance, with the first of the sort at the centre */
      const r = 210 * Math.sqrt(k + .7), a = k * 2.399963;
      out[i] = [Math.cos(a) * r * 1.35, Math.sin(a) * r, Math.sin(k * .7) * 380];
    });
  }

  else if (view === 'timeline'){
    const rows = Math.ceil(N / TL_COLS);
    const bucket = [];
    ord.forEach((i, k) => {
      const row = Math.floor(k / TL_COLS);
      let col = k % TL_COLS;
      if (row % 2) col = TL_COLS - 1 - col;     /* serpentine, so the order never jumps back */
      out[i] = [(col - (TL_COLS - 1) / 2) * TL_CW, (row - (rows - 1) / 2) * TL_RH, 0];
      (bucket[col] || (bucket[col] = [])).push(i);
    });
    bucket.forEach((items, col) => cols.push({
      key: 'c' + col, label: '', color: null,
      x: (col - (TL_COLS - 1) / 2) * TL_CW, halfW: TL_CW / 2,
      top: -(rows / 2) * TL_RH, bottom: (rows / 2) * TL_RH, items
    }));
  }

  else if (view === 'grid'){
    const g = {}; META.meanings.forEach(m => g[m] = []);
    ord.forEach(i => g[DATA[i].means[0]].push(i));
    /* every meaning gets the SAME two columns, so a block's height is its
       count — the arrangement is a bar chart you can read the pictures in */
    const w = META.meanings.map(() => 2);
    const total = w.reduce((a, b) => a + b, 0) * G_CW + (META.meanings.length - 1) * G_GAP;
    let x = -total / 2;
    META.meanings.forEach((m, gi) => {
      const items = g[m], bw = w[gi] * G_CW;
      items.forEach((i, k) => {
        out[i] = [x + (k % w[gi] + .5) * G_CW, GRID_TOP + (Math.floor(k / w[gi]) + .5) * G_RH, 0];
      });
      cols.push({ key: m, label: m, color: META.mcol[m], x: x + bw / 2, halfW: bw / 2,
                  top: GRID_TOP, bottom: GRID_TOP + Math.ceil(items.length / w[gi]) * G_RH, items });
      x += bw + G_GAP;
    });
  }

  else if (view === 'clusters'){
    const g = {}; META.places.forEach(p => g[p] = []);
    ord.forEach(i => g[DATA[i].place].push(i));
    META.places.forEach(p => {
      const items = g[p], at = META.placeAt[p];
      const c = Math.max(1, Math.ceil(Math.sqrt(items.length * 1.25)));
      const r = Math.ceil(items.length / c);
      items.forEach((i, k) => {
        out[i] = [at[0] + (k % c - (c - 1) / 2) * CL_CW,
                  at[1] + (Math.floor(k / c) - (r - 1) / 2) * CL_RH, 0];
      });
      cols.push({ key: p, label: p, color: null, x: at[0], halfW: c * CL_CW / 2,
                  top: at[1] - r * CL_RH / 2, bottom: at[1] + r * CL_RH / 2, items });
    });
  }

  else {                                        /* sphere: round is the order, poles are how often */
    ord.forEach((i, k) => {
      const lon = (k / N) * Math.PI * 2;
      const y = (fnorm(DATA[i]) - .5) * 1.76;   /* seen every day rides the top pole */
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      out[i] = [Math.cos(lon) * r, y, Math.sin(lon) * r];   /* unit — scaled at paint time */
    });
    return { pos: out, columns: cols };
  }

  /* every flat view is centred on what it actually occupies, so a shape built
     around fixed anchors (the clusters hang off their map, the grid hangs off
     a top line) still sits in the middle of the room it is given */
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  out.forEach(p => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
                     if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; });
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  out.forEach(p => { p[0] -= mx; p[1] -= my; });
  cols.forEach(c => { c.x -= mx; c.top -= my; c.bottom -= my; });
  return { pos: out, columns: cols };
}

/* ================================================================== */
function mount(opts){
  const world = opts.world, cv = opts.wire, ctx = cv.getContext('2d');
  const fl = opts.floor, fx = fl.getContext('2d');
  const thumbBase = opts.thumbBase || '../assets/thumb/';

  let view = opts.view || 'sphere', sort = opts.sort || 'colour';
  let focal = 1400, dist = VIEWS[view].dist, camX = 0, camY = 0;
  let yaw = .5, pitch = -.2, spinRate = 0, spinning = false;
  let spread = 1, threads = 1, sphereR = META.sphereR;
  let drag = false, lx = 0, ly = 0, downX = 0, downY = 0, moved = false;
  let animating = false, anim = null, locked = !!opts.locked;
  let hot = -1, pinned = -1, hotLine = -1, hotCol = null, downIdx = -1, downFace = null;
  let guideCol = null, colOf = new Array(N);   /* which column each picture sits in */
  let only = null, lit = null;                   /* lit = a meaning lifted without filtering */
  const freqOn = new Set([0, 1, 2]);
  const kindOn = new Set(['meaning']);
  const inset = { left: 0, right: 0, top: 0, bottom: 0 };
  let columns = [], P = [], segs = [];

  /* edges get a stable rank once, so the Threads slider thins them evenly */
  const eRank = META.edges.map((_, k) => ((k * 2654435761) % 1000) / 1000);

  const ADJ = DATA.map(() => []);
  META.edges.forEach(([a, b, kind, ma, mb]) => {
    ADJ[a].push([b, kind, ma, mb]); ADJ[b].push([a, kind, mb, ma]);
  });
  const hasMeaning = (i, m) => DATA[i].means.indexOf(m) >= 0;
  const live = i => (!only || hasMeaning(i, only)) && freqOn.has(DATA[i].fb);
  function edgeOk(a, b, kind, ma, mb){
    if (!kindOn.has(kind)) return false;
    if (!freqOn.has(DATA[a].fb) || !freqOn.has(DATA[b].fb)) return false;
    if (only){
      const t = kind === 'meaning' ? (ma === only || mb === only)
                                   : (hasMeaning(a, only) || hasMeaning(b, only));
      if (!t) return false;
    }
    return true;
  }
  const linksOf = i => ADJ[i].filter(l => edgeOk(i, l[0], l[1], l[2], l[3]));

  /* ---------- placing ---------- */
  function rot(u){
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x = u[0] * cy + u[2] * sy, z1 = -u[0] * sy + u[2] * cy;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [x, u[1] * cp - z1 * sp, u[1] * sp + z1 * cp];
  }
  let raw = layout(view, sort);
  const scaled = () => view === 'sphere'
    ? raw.pos.map(u => { const r = rot(u), R = sphereR * spread; return [r[0] * R, r[1] * R, r[2] * R]; })
    : raw.pos.map(p => [p[0] * spread, p[1] * spread, p[2]]);
  let pos = scaled();
  columns = raw.columns;
  columns.forEach(c => c.items.forEach(i => colOf[i] = c.key));

  function relayout(){
    raw = layout(view, sort); columns = raw.columns;
    colOf = new Array(N);
    columns.forEach(c => c.items.forEach(i => colOf[i] = c.key));
  }

  /* ---------- holding a picture ---------- */
  function buildFocus(i){
    const ln = linksOf(i), base = scaled(), out = base.map(p => p.slice());
    out[i] = [0, 0, 0];
    const R0 = dist * .26, RING = dist * .115;
    /* the ring is a constant .26 * focal on screen; widen it only as far as the
       room actually left beside the panel, or the kin sit under the sidebar */
    const halfW = (innerWidth - inset.left - inset.right) / 2;
    const xMul = Math.max(.92, Math.min(1.45, (halfW - 90) / (.26 * focal)));
    ln.forEach((l, k) => {
      const ring = Math.floor(k / 12), inRing = k % 12, per = Math.min(12, ln.length - ring * 12);
      const a = (inRing / per) * Math.PI * 2 - Math.PI / 2 + ring * .26;
      const r = R0 + ring * RING;
      out[l[0]] = [Math.cos(a) * r * xMul, Math.sin(a) * r, 0];
    });
    const kin = new Set(ln.map(l => l[0]));
    base.forEach((p, j) => {
      if (j === i || kin.has(j)) return;
      const d = Math.hypot(p[0], p[1]) || 1;
      out[j] = [p[0] / d * dist * .85, p[1] / d * dist * .85, p[2] * .3];
    });
    return out;
  }
  function easeTo(target, T, done){
    T = T || 700;
    const from = pos.map(p => p.slice()), t0 = performance.now();
    cancelAnimationFrame(anim);
    (function step(now){
      const u = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - u, 3);
      pos = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * e,
                                p[1] + (target[i][1] - p[1]) * e,
                                p[2] + (target[i][2] - p[2]) * e]);
      paint();
      if (u < 1) anim = requestAnimationFrame(step);
    })(t0);
    setTimeout(() => { pos = done ? done() : target.map(p => p.slice()); paint(); }, T + 60);
  }
  function hold(i){
    if (locked) return;
    pinned = i; camX = camY = 0; hotCol = null;
    easeTo(buildFocus(i));
    if (opts.onHold) opts.onHold(i, linksOf(i));
    paint();
  }
  function release(){
    if (pinned < 0) return;
    pinned = -1;
    easeTo(scaled(), 700, scaled);
    if (opts.onRelease) opts.onRelease();
    paint();
  }

  /* ---------- pictures ---------- */
  const nodes = DATA.map((d, i) => {
    const el = document.createElement('div');
    el.className = 'node';
    el.innerHTML =
      '<div class="card"><div class="face front">' +
        '<img src="' + thumbBase + d.thumb + '" alt="" draggable="false">' +
        '<div class="wash" style="background:' + META.mcol[d.means[0]] + '"></div>' +
      '</div><div class="face back"></div></div>';
    const front = el.querySelector('.front');
    front.addEventListener('mouseenter', () => { hot = i; paint(); });
    front.addEventListener('mouseleave', () => { hot = -1; paint(); });
    front.addEventListener('mousedown', e => { e.stopPropagation(); downIdx = i; downFace = 'front'; });
    el.querySelector('.back').addEventListener('mousedown', e => { e.stopPropagation(); downIdx = i; downFace = 'back'; });
    el.__i = i;
    world.appendChild(el);
    return el;
  });

  const mkLabel = t => { const e = document.createElement('div');
    e.className = 'label'; e.textContent = t; world.appendChild(e); return e; };
  const colLabels = [];
  const poleLabels = [['seen every day', [0, -1, 0]], ['seen rarely', [0, 1, 0]]]
    .map(p => ({ el: mkLabel(p[0]), u: p[1] }));

  /* ---------- projection ---------- */
  const midX = () => (inset.left + innerWidth - inset.right) / 2;
  const midY = () => (inset.top + innerHeight - inset.bottom) / 2;
  function project(x, y, z){
    const d = z + dist;
    if (d < 90) return null;
    const s = focal / d;
    return { x: midX() + (x - camX) * s, y: midY() + (y - camY) * s, s: s, d: d };
  }
  const rgba = (hex, a) => { const v = parseInt(hex.slice(1), 16);
    return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + a + ')'; };
  function grad(pa, pb, ca, cb, alpha){
    if (ca === cb) return rgba(ca, alpha);
    const g = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
    g.addColorStop(0, rgba(ca, alpha)); g.addColorStop(1, rgba(cb, alpha));
    return g;
  }
  function edgeColor(a, b, kind, ma, mb){
    if (kind === 'meaning') return [META.mcol[ma], META.mcol[mb]];
    if (kind === 'color')   return [DATA[a].hex, DATA[b].hex];
    return [META.kindColor[kind], META.kindColor[kind]];
  }
  const last = new Map();
  function put(el, k, v){
    const key = el.__i + ':' + k;
    if (last.get(key) === v) return;
    last.set(key, v); el.style[k] = v;
  }
  function arcPts(ia, ib, steps){
    steps = steps || 14;
    const a = rot(raw.pos[ia]), b = rot(raw.pos[ib]), R = sphereR * spread;
    const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const om = Math.acos(dot), so = Math.sin(om), pts = []; let zs = 0;
    for (let k = 0; k <= steps; k++){
      const t = k / steps;
      const s1 = so < 1e-4 ? 1 - t : Math.sin((1 - t) * om) / so;
      const s2 = so < 1e-4 ? t : Math.sin(t * om) / so;
      const x = a[0] * s1 + b[0] * s2, y = a[1] * s1 + b[1] * s2, z = a[2] * s1 + b[2] * s2;
      const q = project(x * R, y * R, z * R);
      if (!q) return null;
      pts.push(q); zs += z;
    }
    pts.back = zs / (steps + 1) > .05;
    return pts;
  }
  function fanPts(a, b, k, steps){
    steps = steps || 16;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    const bow = Math.min(120, L * .17) * (k % 2 ? 1 : -1);
    const cx = mx - dy / L * bow, cy = my + dx / L * bow, pts = [];
    for (let s = 0; s <= steps; s++){
      const t = s / steps, u = 1 - t;
      pts.push({ x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
                 y: u * u * a.y + 2 * u * t * cy + t * t * b.y });
    }
    return pts;
  }
  function drawPoly(c, pts){
    c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
    for (let k = 1; k < pts.length; k++) c.lineTo(pts[k].x, pts[k].y);
    c.stroke();
  }

  /* ---------- the guides underneath ----------
     The structure a view is built on, drawn as plain rules so the
     arrangement is readable even before a single thread is followed. */
  function paintFloor(){
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (fl.width !== innerWidth * dpr){ fl.width = innerWidth * dpr; fl.height = innerHeight * dpr; }
    fl.style.width = innerWidth + 'px'; fl.style.height = innerHeight + 'px';
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.clearRect(0, 0, innerWidth, innerHeight);
    if (view === 'sphere' || pinned >= 0 || animating) return;

    columns.forEach(c => {
      const on = guideCol === c.key;
      const a = project((c.x - c.halfW) * spread, c.top * spread, 0);
      const b = project((c.x + c.halfW) * spread, c.bottom * spread, 0);
      if (!a || !b) return;
      fx.lineWidth = 1;
      fx.strokeStyle = c.color ? rgba(c.color, on ? .5 : .14)
                               : 'rgba(255,255,255,' + (on ? .2 : .07) + ')';
      if (view === 'timeline'){
        fx.beginPath(); fx.moveTo(a.x, a.y); fx.lineTo(a.x, b.y); fx.stroke();
      } else {
        fx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
        if (on){ fx.fillStyle = c.color ? rgba(c.color, .07) : 'rgba(255,255,255,.04)';
                 fx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); }
      }
    });

    /* the timeline carries its own key: a bar of the sorted-by colour
       under each picture, so the order is legible as a stripe */
    if (view === 'timeline'){
      DATA.forEach((d, i) => {
        const p = P[i]; if (!p || !live(i)) return;
        const w = TILE * p.s * .8, h = Math.max(2, 7 * p.s * 4);
        fx.fillStyle = rgba(sortColour(i, sort), .85);
        fx.fillRect(p.x - w / 2, p.y + TILE * p.s * .42, w, h);
      });
    }
  }

  /* ---------- draw ---------- */
  function paint(){
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== innerWidth * dpr){ cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    P = pos.map(p => project(p[0], p[1], p[2]));
    const focusI = pinned >= 0 ? pinned : hot;
    const ln = focusI >= 0 ? linksOf(focusI) : [];
    const kin = new Set(ln.map(l => l[0]));
    const globe = view === 'sphere' && pinned < 0 && !animating;
    const shrink = view === 'sphere' && pinned < 0 ? .72 : 1;
    const colSet = hotCol ? new Set((columns.find(c => c.key === hotCol) || { items: [] }).items) : null;
    guideCol = hotCol || (focusI >= 0 ? colOf[focusI] || null : null);

    DATA.map((_, i) => i).filter(i => P[i]).sort((a, b) => P[b].d - P[a].d).forEach(i => {
      const p = P[i], el = nodes[i], held = i === pinned;
      const far = globe && pos[i][2] > 0;
      const big = i === focusI ? 1.25 + .75 * (DATA[i].deg / META.maxdeg) : 1;
      let w = TILE * p.s * big * shrink, h = w * .8;
      if (held){ h = Math.min(innerHeight * .40, 430); w = h / .82; }
      else if (pinned >= 0 && kin.has(i)){
        const floor = Math.min(innerHeight * .15, 150);
        if (h < floor){ h = floor; w = h / .8; }
      }
      put(el, 'transform', 'translate(' + Math.round(p.x - w / 2) + 'px,' + Math.round(p.y - h / 2) + 'px)');
      put(el, 'width', Math.round(w) + 'px'); put(el, 'height', Math.round(h) + 'px');
      el.classList.toggle('held', held);
      const flip = held && hot === i;
      el.classList.toggle('flip', flip);
      if (flip) fillBack(el, i, ln);

      let op;
      if (!live(i)) op = .08;
      else if (focusI >= 0) op = i === focusI ? 1 : kin.has(i) ? .95 : far ? .1 : .24;
      else if (colSet) op = colSet.has(i) ? 1 : .2;
      else if (lit) op = hasMeaning(i, lit) ? 1 : .18;
      else op = far ? .3 : 1;
      put(el, 'opacity', String(op));

      /* NEVER negative. A child with a negative z-index paints behind its own
         positioned parent, which would put #world on top of every picture and
         make all 150 of them unhittable — no hover, no click, in any view. */
      put(el, 'zIndex', String(held ? 30000 : i === focusI ? 25000
        : (pinned >= 0 && kin.has(i)) ? 20000 : Math.max(1, 19000 - Math.round(p.d / 4))));
    });

    paintFloor();

    /* the resting threads — the meanings of the grids, drawn as colour */
    ctx.lineWidth = 1.4;
    META.edges.forEach((e, k) => {
      if (eRank[k] > threads) return;
      const a = e[0], b = e[1], kind = e[2], ma = e[3], mb = e[4];
      if (!edgeOk(a, b, kind, ma, mb)) return;
      let pts;
      if (globe){ pts = arcPts(a, b); if (!pts) return; }
      else { if (!P[a] || !P[b]) return; pts = [P[a], P[b]]; }
      let base = (focusI < 0 ? .34 : .07) * (kind === 'meaning' ? 1 : .8);
      if (lit && focusI < 0) base = (ma === lit || mb === lit) ? .75 : .05;
      if (colSet && focusI < 0) base = (colSet.has(a) || colSet.has(b)) ? .6 : .05;
      const cc = edgeColor(a, b, kind, ma, mb);
      ctx.strokeStyle = grad(pts[0], pts[pts.length - 1], cc[0], cc[1], pts.back ? base * .3 : base);
      drawPoly(ctx, pts);
    });

    /* the threads of the picture in hand */
    segs = [];
    if (focusI >= 0 && live(focusI) && P[focusI]){
      ln.forEach((l, k) => {
        const j = l[0];
        if (!P[j] || !live(j)) return;
        let pts;
        if (pinned >= 0) pts = fanPts(P[focusI], P[j], k);
        else if (globe) pts = arcPts(focusI, j) || [P[focusI], P[j]];
        else pts = [P[focusI], P[j]];
        segs.push({ pts: pts, j: j, kind: l[1], ma: l[2], mb: l[3], b: P[j] });
      });
      segs.forEach((sg, k) => {
        const on = k === hotLine, cc = edgeColor(focusI, sg.j, sg.kind, sg.ma, sg.mb);
        ctx.strokeStyle = on ? GOLD : grad(sg.pts[0], sg.pts[sg.pts.length - 1], cc[0], cc[1], .9);
        ctx.lineWidth = on ? 3.4 : 2;
        drawPoly(ctx, sg.pts);
      });
      if (hotLine >= 0 && segs[hotLine]){
        const t = segs[hotLine].b;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
        ctx.strokeRect(t.x - TILE * t.s / 2 - 4, t.y - TILE * t.s * .4 - 4,
                       TILE * t.s + 8, TILE * t.s * .8 + 8);
      }
    }
    paintLabels(globe, focusI);
  }

  function paintLabels(globe, focusI){
    while (colLabels.length < columns.length) colLabels.push(mkLabel(''));
    const dim = focusI < 0 ? 1 : .3;
    colLabels.forEach((el, k) => {
      const c = columns[k];
      if (!c || !c.label || view === 'sphere' || animating || pinned >= 0){ el.style.opacity = 0; return; }
      const q = project(c.x * spread, (c.top - 330) * spread, 0);   /* clear of the block above */
      if (!q){ el.style.opacity = 0; return; }
      el.textContent = c.label;
      el.style.transform = 'translate(' + q.x + 'px,' + q.y + 'px) translate(-50%,-50%)';
      el.style.fontSize = Math.max(9, Math.min(15, 11 * q.s * 1.5)) + 'px';
      el.style.color = c.color && guideCol === c.key ? c.color : '';
      el.classList.toggle('lit', guideCol === c.key);
      el.style.opacity = (hotCol && hotCol !== c.key ? .25 : .85) * dim;
    });
    poleLabels.forEach(o => {
      if (!globe){ o.el.style.opacity = 0; return; }
      /* 1.05, not 1.16: the poles are what the sphere is sorted by, and they are
         no use to anyone sitting just past the top and bottom of the window */
      const r = rot(o.u), R = sphereR * spread * 1.05, q = project(r[0] * R, r[1] * R, r[2] * R);
      if (!q){ o.el.style.opacity = 0; return; }
      o.el.style.transform = 'translate(' + q.x + 'px,' + q.y + 'px) translate(-50%,-50%)';
      o.el.style.fontSize = '11px';
      o.el.style.opacity = (r[2] > .35 ? .15 : .75) * dim;
    });
  }

  function donut(slices, total, size){
    let acc = 0; const stops = [];
    slices.forEach(s => {
      stops.push(s[0] + ' ' + (acc / total * 360).toFixed(1) + 'deg ' +
                 ((acc + s[1]) / total * 360).toFixed(1) + 'deg');
      acc += s[1];
    });
    return '<div class="donut" style="width:' + size + 'px;height:' + size + 'px;background:' +
           (stops.length ? 'conic-gradient(' + stops.join(',') + ')' : '#ddd') + '"></div>';
  }
  function fillBack(el, i, ln){
    const d = DATA[i], by = {}, ord2 = [];
    ln.forEach(l => {
      const kind = l[1], mb = l[3];
      const key = kind === 'meaning' ? mb : kind;
      const label = kind === 'meaning' ? mb : META.kindLabel[kind];
      const color = kind === 'meaning' ? META.mcol[mb] : (kind === 'color' ? d.hex : META.kindColor[kind]);
      if (!by[key]){ by[key] = { n: 0, label: label, color: color }; ord2.push(key); }
      by[key].n++;
    });
    ord2.sort((a, b) => by[b].n - by[a].n);
    const max = ord2.length ? by[ord2[0]].n : 1;
    const bars = ord2.map(k => {
      const r = by[k];
      return '<div class="brow"><i style="background:' + r.color + '"></i><u>' + r.label + '</u>' +
        '<div class="btrack"><div class="bfill" style="width:' + Math.round(r.n / max * 100) +
        '%;background:' + r.color + '"></div></div><b>' + r.n + '</b></div>';
    }).join('');
    el.querySelector('.back').innerHTML =
      '<div class="t">' + d.title + '</div>' +
      '<div class="r"><span>Does</span><b>' + d.means.map(m =>
        '<span style="color:' + META.mcol[m] + '">' + m + '</span>').join(' + ') + '</b></div>' +
      '<div class="r"><span>Found in</span><b>' + d.place + '</b></div>' +
      '<div class="r"><span>Colour</span><b>' + familyOf(d) + '</b></div>' +
      '<div class="r"><span>Seen</span><b>' + META.freqBuckets[d.fb] + '</b></div>' +
      '<div class="pie">' + (ln.length ? donut(ord2.map(k => [by[k].color, by[k].n]), ln.length, 56) : '') +
      '<div class="pien"><b>' + ln.length + '</b><span>joined</span></div></div>' +
      '<div class="k">' + (bars || '<span style="color:#8b8779;font-size:12px">nothing else shares this yet</span>') + '</div>';
  }

  /* ---------- following a thread ---------- */
  function nearestSeg(mx, my){
    let best = -1, bd = 9;
    segs.forEach((s, k) => {
      const pts = s.pts, first = pts.length === 2 ? 0 : Math.floor((pts.length - 1) * .14);
      for (let n = first; n < pts.length - 1; n++){
        const a = pts[n], b = pts[n + 1], dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
        if (!L) continue;
        let t = ((mx - a.x) * dx + (my - a.y) * dy) / L;
        t = pts.length === 2 ? Math.max(.14, Math.min(1, t)) : Math.max(0, Math.min(1, t));
        const d = Math.hypot(mx - (a.x + dx * t), my - (a.y + dy * t));
        if (d < bd){ bd = d; best = k; }
      }
    });
    return best;
  }
  function colAt(mx, my){
    if (view === 'sphere' || pinned >= 0 || animating) return null;
    for (let k = 0; k < columns.length; k++){
      const c = columns[k];
      const a = project((c.x - c.halfW) * spread, c.top * spread, 0);
      const b = project((c.x + c.halfW) * spread, c.bottom * spread, 0);
      if (!a || !b) continue;
      const pad = view === 'timeline' ? 0 : 10;
      if (mx < a.x - pad || mx > b.x + pad) continue;
      /* grid and timeline columns are full-height strips — you should be able to
         pick one anywhere down its length, not only where the pictures happen to be */
      if (view !== 'clusters') return c.key;
      if (my >= a.y - 40 && my <= b.y + pad) return c.key;
    }
    return null;
  }

  /* ---------- moving about ---------- */
  const inChrome = e => e.target && e.target.closest && e.target.closest('.chrome');
  addEventListener('mousedown', e => {
    if (inChrome(e)) return;
    downIdx = -1; downFace = null;
    drag = true; moved = false; lx = downX = e.clientX; ly = downY = e.clientY;
    document.body.classList.add('drag');
  }, true);                                   /* capture: before a node's own handler */
  addEventListener('mouseup', e => {
    drag = false; document.body.classList.remove('drag');
    if (moved || inChrome(e) || locked) return;
    if (downFace === 'back'){ release(); return; }
    /* trust the live hover over whatever was under the first pixel — growth
       on hover moves a picture's box between mousedown and mouseup */
    const target = hot >= 0 ? hot : downIdx;
    if (target >= 0){ pinned === target ? release() : hold(target); return; }
    if (hotLine >= 0 && segs[hotLine]){
      const j = segs[hotLine].j;
      hotLine = -1; document.body.classList.remove('overline');
      hold(j); return;
    }
    if (pinned >= 0) release();
  });
  addEventListener('mousemove', e => {
    if (drag){
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true;
      lx = e.clientX; ly = e.clientY;
      if (view === 'sphere' && pinned < 0 && !animating){
        yaw += dx * .005;
        pitch = Math.max(-1.25, Math.min(1.25, pitch + dy * .004));
        pos = scaled();
      } else {
        const s = focal / dist;
        camX -= dx / s; camY -= dy / s;
      }
      paint();
      return;
    }
    if (inChrome(e)) return;
    let dirty = false;
    if (segs.length){
      const k = nearestSeg(e.clientX, e.clientY);
      if (k !== hotLine){ hotLine = k; document.body.classList.toggle('overline', k >= 0); dirty = true; }
    }
    if (hot < 0 && pinned < 0){
      const c = colAt(e.clientX, e.clientY);
      if (c !== hotCol){ hotCol = c; dirty = true; if (opts.onColumn) opts.onColumn(c); }
    } else if (hotCol){ hotCol = null; dirty = true; if (opts.onColumn) opts.onColumn(null); }
    if (dirty) paint();
  });
  addEventListener('wheel', e => {
    if (inChrome(e)) return;
    e.preventDefault();
    dist = Math.max(700, Math.min(14000, dist * (e.deltaY > 0 ? 1.075 : .93)));
    if (opts.onZoom) opts.onZoom(dist);
    paint();
  }, { passive: false });
  addEventListener('resize', paint);

  /* ---------- the slow turn behind a cover ---------- */
  function spinFrame(){
    if (!spinning) return;
    if (view === 'sphere' && pinned < 0 && !drag && !animating){
      yaw += spinRate; pos = scaled(); paint();
    }
    requestAnimationFrame(spinFrame);
  }

  /* ---------- moving between views ---------- */
  function goTo(v, keepDist){
    const wasSphere = view === 'sphere';
    view = v;
    if (!keepDist) dist = VIEWS[v].dist;
    camX = camY = 0; pinned = -1; hotCol = null;
    relayout();
    const to = scaled();
    if (wasSphere !== (v === 'sphere')) { /* the shape changes completely — still tween */ }
    const from = pos.map(p => p.slice()), t0 = performance.now(), T = 950;
    animating = true; cancelAnimationFrame(anim);
    (function step(now){
      const u = Math.min(1, (now - t0) / T);
      const e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      pos = from.map((p, i) => [p[0] + (to[i][0] - p[0]) * e, p[1] + (to[i][1] - p[1]) * e,
                                p[2] + (to[i][2] - p[2]) * e]);
      paint();
      if (u < 1) anim = requestAnimationFrame(step);
    })(t0);
    setTimeout(() => { animating = false; pos = scaled(); paint(); }, T + 60);
    if (opts.onView) opts.onView(v);
  }
  function reSort(s){
    sort = s; relayout();
    const to = scaled(), from = pos.map(p => p.slice()), t0 = performance.now(), T = 820;
    animating = true; cancelAnimationFrame(anim);
    (function step(now){
      const u = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - u, 3);
      pos = from.map((p, i) => [p[0] + (to[i][0] - p[0]) * e, p[1] + (to[i][1] - p[1]) * e,
                                p[2] + (to[i][2] - p[2]) * e]);
      paint();
      if (u < 1) anim = requestAnimationFrame(step);
    })(t0);
    setTimeout(() => { animating = false; pos = scaled(); paint(); }, T + 60);
  }

  const api = {
    VIEWS: VIEWS, VIEW_ORDER: VIEW_ORDER, SORTS: SORTS, SORT_ORDER: SORT_ORDER,
    SORT_NOTE: SORT_NOTE, ICON: ICON,
    get view(){ return view; }, get sort(){ return sort; }, get dist(){ return dist; },
    get only(){ return only; }, get pinned(){ return pinned; },
    goTo: goTo, reSort: reSort, paint: paint, hold: hold, release: release,
    setOnly(m){ only = m; paint(); },
    setLit(m){ lit = m; paint(); },
    setColumn(k){ hotCol = k; paint(); },
    columnKeys(){ return columns.map(c => c.key).filter(Boolean); },
    toggleFreq(k){ freqOn.has(k) ? (freqOn.size > 1 && freqOn.delete(k)) : freqOn.add(k); paint(); },
    hasFreq(k){ return freqOn.has(k); },
    toggleKind(k){ kindOn.has(k) ? (kindOn.size > 1 && kindOn.delete(k)) : kindOn.add(k); paint(); },
    hasKind(k){ return kindOn.has(k); },
    reset(){ only = null; lit = null; [0,1,2].forEach(k => freqOn.add(k));
             kindOn.clear(); kindOn.add('meaning'); threads = 1; paint(); },
    setZoom(t){ dist = 12500 - t * 9200; paint(); },          /* t 0..1, near at 1 */
    zoomT(){ return Math.max(0, Math.min(1, (12500 - dist) / 9200)); },
    setSpread(v){ spread = v; pos = scaled(); paint(); },
    setThreads(v){ threads = v; paint(); },
    setTurn(v){ yaw = v * Math.PI * 2; pos = scaled(); paint(); },
    turnT(){ return (yaw / (Math.PI * 2)) % 1; },
    setLocked(v){ locked = v; if (v){ pinned = -1; hotCol = null; } },
    spin(rate){ spinRate = rate; if (rate && !spinning){ spinning = true; spinFrame(); }
                if (!rate) spinning = false; },
    setInset(o){ Object.assign(inset, o); paint(); },
    ready(cb){
      let n = 0;
      const imgs = world.querySelectorAll('img');
      const tick = () => { if (++n >= imgs.length) cb(); };
      imgs.forEach(im => im.complete ? tick() : (im.onload = tick, im.onerror = tick));
      if (!imgs.length) cb();
    }
  };
  paint();
  return api;
}

global.Loom = { mount: mount, VIEWS: VIEWS, VIEW_ORDER: VIEW_ORDER,
                SORTS: SORTS, SORT_ORDER: SORT_ORDER, SORT_NOTE: SORT_NOTE, ICON: ICON,
                familyOf: familyOf };
})(window);
