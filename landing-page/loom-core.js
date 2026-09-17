/* ------------------------------------------------------------------
   Loom — the engine, shared by both landing-page drafts.

   Every picture carries one or two of nine things a grid can do.
   A line joins two pictures that share a meaning; its colour says
   which, and a line that changes colour crossed from one meaning into
   another. That is the whole legend: the lines ARE the meanings of the
   grids. Same rule as index.html — only meaning ties a picture to
   another, so the field never fills with lines that say nothing.

   A view is a shape. A sort is an order — and, where a view groups,
   the sort is also what it groups and labels by. Change the sort and
   the column names change with it.

   Loads after ../assets/loom.js, which defines DATA and META.
------------------------------------------------------------------ */
(function (global) {
'use strict';

const N = DATA.length, TILE = META.tile, GOLD = META.gold;

const VIEWS = {
  nodes:    { label: 'Nodes'    },
  timeline: { label: 'Timeline' },
  clusters: { label: 'Clusters' },
  grid:     { label: 'Grid'     },
  sphere:   { label: 'Sphere'   }
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

/* ---------- what a sort groups and names things by ---------- */
const FAMS = ['neutral', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'violet', 'magenta'];
const FAMCOL = { neutral:'#9a968d', red:'#d45454', orange:'#d48a54', yellow:'#d4c454',
                 green:'#7ad454', cyan:'#54c4d4', blue:'#5470d4', violet:'#9a54d4', magenta:'#d454a9' };
const FAMCUT = [[15,'red'],[45,'orange'],[70,'yellow'],[160,'green'],[200,'cyan'],
                [255,'blue'],[290,'violet'],[335,'magenta'],[361,'red']];
const familyOf = d => d.sat < 8 ? 'neutral' : FAMCUT.find(f => d.hue < f[0])[1];
const FREQCOL = ['#e6e2d8', '#a8a49a', '#6b6860'];

const MIDX = {}; META.meanings.forEach((m, i) => MIDX[m] = i);
const FMIN = Math.min.apply(null, DATA.map(d => d.freq));
const FMAX = Math.max.apply(null, DATA.map(d => d.freq));
const fnorm = d => (d.freq - FMIN) / (FMAX - FMIN || 1);

function grouping(sort){
  if (sort === 'meaning')
    return { keys: META.meanings, of: i => DATA[i].means[0], col: k => META.mcol[k] };
  if (sort === 'colour')
    return { keys: FAMS, of: i => familyOf(DATA[i]), col: k => FAMCOL[k] };
  return { keys: META.freqBuckets, of: i => META.freqBuckets[DATA[i].fb],
           col: k => FREQCOL[META.freqBuckets.indexOf(k)] };
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

/* ---------- the five shapes ---------- */
const TL_CW = 360, TL_PER = 38, TL_RH = 420;        /* the endless strip's pitch */
const G_CW = 300, G_RH = 255, G_GAP = 170, G_WIDE = 2;
const CL_CW = 275, CL_RH = 235, CL_GAP = 420, CL_VGAP = 560;

function layout(view, sort){
  const ord = order(sort), out = new Array(N), cols = [];
  const G = grouping(sort);

  if (view === 'nodes'){
    ord.forEach((i, k) => {
      const r = 250 * Math.sqrt(k + .7), a = k * 2.399963;
      out[i] = [Math.cos(a) * r * 1.35, Math.sin(a) * r, Math.sin(k * .7) * 380];
    });
  }

  else if (view === 'timeline'){
    /* an endless strip, four bands deep so the whole run has somewhere to be.
       Every band scrolls in lockstep and wraps at the same width, so the loop
       never shows a seam; lightness gives each picture a slow wave inside its
       band, which keeps the run reading as a run and not as a fence. */
    const bands = Math.ceil(N / TL_PER);
    ord.forEach((i, k) => {
      const band = Math.floor(k / TL_PER), col = k % TL_PER;
      out[i] = [(col - (TL_PER - 1) / 2) * TL_CW,
                (band - (bands - 1) / 2) * TL_RH + (DATA[i].lit - 50) * 1.7, 0];
    });
    return { pos: out, columns: cols, loopW: TL_PER * TL_CW };
  }

  else if (view === 'grid'){
    /* every group the same two columns wide, so a column's HEIGHT is its
       count — the arrangement is a bar chart you can read the pictures in */
    const g = {}; G.keys.forEach(k => g[k] = []);
    ord.forEach(i => g[G.of(i)].push(i));
    const live = G.keys.filter(k => g[k].length);
    /* two wide as a rule, wider only when a group would otherwise run 16 deep
       and drag the whole chart small — area still reads as count either way */
    const wide = live.map(k => Math.max(G_WIDE, Math.ceil(g[k].length / 16)));
    const total = wide.reduce((a, b) => a + b, 0) * G_CW + (live.length - 1) * G_GAP;
    let x = -total / 2;
    live.forEach((k, gi) => {
      const items = g[k], w = wide[gi], bw = w * G_CW;
      items.forEach((i, n) => {
        out[i] = [x + (n % w + .5) * G_CW, (Math.floor(n / w) + .5) * G_RH, 0];
      });
      cols.push({ key: k, label: k, color: G.col(k), x: x + bw / 2, halfW: bw / 2,
                  top: 0, bottom: Math.ceil(items.length / w) * G_RH, items: items });
      x += bw + G_GAP;
    });
  }

  else if (view === 'clusters'){
    /* the same groups, but loose — shelved three across and centred */
    const g = {}; G.keys.forEach(k => g[k] = []);
    ord.forEach(i => g[G.of(i)].push(i));
    const live = G.keys.filter(k => g[k].length);
    const per = live.length <= 3 ? live.length : 3;
    const blocks = live.map(k => {
      const n = g[k].length, c = Math.max(1, Math.ceil(Math.sqrt(n * 1.3)));
      return { k: k, items: g[k], c: c, r: Math.ceil(n / c), w: c * CL_CW, h: Math.ceil(n / c) * CL_RH };
    });
    let y = 0;
    for (let row = 0; row < Math.ceil(blocks.length / per); row++){
      const line = blocks.slice(row * per, row * per + per);
      const lineW = line.reduce((a, b) => a + b.w, 0) + (line.length - 1) * CL_GAP;
      const lineH = Math.max.apply(null, line.map(b => b.h));
      let x = -lineW / 2;
      line.forEach(b => {
        /* hang every island from the row's top line, so the whole row's names
           sit on one line and none of them lands inside the block above */
        const cx = x + b.w / 2, cy = y + b.h / 2;
        b.items.forEach((i, n) => {
          out[i] = [cx + (n % b.c - (b.c - 1) / 2) * CL_CW,
                    cy + (Math.floor(n / b.c) - (b.r - 1) / 2) * CL_RH, 0];
        });
        cols.push({ key: b.k, label: b.k, color: G.col(b.k), x: cx, halfW: b.w / 2,
                    top: cy - b.h / 2, bottom: cy + b.h / 2, items: b.items });
        x += b.w + CL_GAP;
      });
      y += lineH + CL_VGAP;          /* room for the next row's names */
    }
  }

  else {                                      /* sphere: round is the order, poles are how often */
    ord.forEach((i, k) => {
      const lon = (k / N) * Math.PI * 2;
      const y = (fnorm(DATA[i]) - .5) * 1.76;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      out[i] = [Math.cos(lon) * r, y, Math.sin(lon) * r];       /* unit — scaled at paint */
    });
    return { pos: out, columns: cols };
  }

  /* every flat view is centred on what it actually occupies */
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  out.forEach(p => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
                     if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; });
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  out.forEach(p => { p[0] -= mx; p[1] -= my; });
  cols.forEach(c => { c.x -= mx; c.top -= my; c.bottom -= my; });
  return { pos: out, columns: cols, ext: [x1 - x0, y1 - y0] };
}

/* ================================================================== */
function mount(opts){
  const world = opts.world, cv = opts.wire, ctx = cv.getContext('2d');
  const fl = opts.floor, fx = fl.getContext('2d');
  const thumbBase = opts.thumbBase || '../assets/thumb/';
  const SR = META.sphereR;

  let view = opts.view || 'sphere', sort = opts.sort || 'colour';
  const focal = 1400;
  let dist = 6000, camX = 0, camY = 0, scrollX = 0, scrollV = 0, userZoom = false;
  let yaw = .5, pitch = -.2, motion = opts.motion == null ? .35 : opts.motion, running = false;
  let drag = false, lx = 0, ly = 0, downX = 0, downY = 0, moved = false;
  let animating = false, anim = null, locked = !!opts.locked;
  let hot = -1, pinned = -1, hotLine = -1, hotCol = null, downIdx = -1, downFace = null;
  let only = null, lit = null, guideCol = null;
  const inset = { left: 0, right: 0, top: 0, bottom: 0 };
  let columns = [], colOf = new Array(N), P = [], segs = [];

  /* only meaning ties one picture to another — same rule as index.html */
  const EDGES = META.edges.filter(e => e[2] === 'meaning');
  const ADJ = DATA.map(() => []);
  EDGES.forEach(e => { ADJ[e[0]].push([e[1], e[3], e[4]]); ADJ[e[1]].push([e[0], e[4], e[3]]); });
  const hasMeaning = (i, m) => DATA[i].means.indexOf(m) >= 0;
  /* one meaning chosen: that meaning's pictures, and the ties between them */
  const live = i => !only || hasMeaning(i, only);
  const edgeOk = (a, b, ma, mb) => !only || (ma === only && mb === only);
  const linksOf = i => ADJ[i].filter(l => edgeOk(i, l[0], l[1], l[2]));

  /* ---------- placing ---------- */
  function rot(u){
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x = u[0] * cy + u[2] * sy, z1 = -u[0] * sy + u[2] * cy;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [x, u[1] * cp - z1 * sp, u[1] * sp + z1 * cp];
  }
  let raw = layout(view, sort);

  /* the field frames itself into whatever room the panel has left it, so no
     zoom control is needed and every view/sort pairing arrives readable */
  function fit(){
    if (userZoom) return;
    const halfW = (innerWidth - inset.left - inset.right) / 2 - 34;
    const halfH = innerHeight / 2 - 54;   /* room for the column names above */
    let s;
    if (view === 'timeline') s = .23;                      /* a fixed, comfortable tile */
    else if (view === 'sphere') s = Math.min(halfW, halfH) / (SR + TILE * .42);
    else {
      const e = raw.ext || [4000, 4000];
      s = Math.min(halfW / (e[0] / 2 + TILE * .5), halfH / (e[1] / 2 + TILE * .45));
    }
    dist = Math.max(1600, Math.min(26000, focal / s));
  }
  function wrap(x){
    const W = raw.loopW;
    return ((x + W / 2) % W + W) % W - W / 2;
  }
  const scaled = () =>
    view === 'sphere' ? raw.pos.map(u => { const r = rot(u);
                                           return [r[0] * SR, r[1] * SR, r[2] * SR]; })
  : view === 'timeline' ? raw.pos.map(p => [wrap(p[0] - scrollX), p[1], p[2]])
  : raw.pos.map(p => p.slice());

  function relayout(){
    raw = layout(view, sort);
    columns = raw.columns;
    colOf = new Array(N);
    columns.forEach(c => c.items.forEach(i => colOf[i] = c.key));
    fit();
  }
  relayout();
  let pos = scaled();

  /* ---------- holding a picture ---------- */
  function buildFocus(i){
    const ln = linksOf(i), base = scaled(), out = base.map(p => p.slice());
    out[i] = [0, 0, 0];
    const R0 = dist * .26, RING = dist * .115;
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
  function tween(target, T, done){
    const from = pos.map(p => p.slice()), t0 = performance.now();
    animating = true; cancelAnimationFrame(anim);
    (function step(now){
      const u = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - u, 3);
      pos = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * e,
                                p[1] + (target[i][1] - p[1]) * e,
                                p[2] + (target[i][2] - p[2]) * e]);
      paint();
      if (u < 1) anim = requestAnimationFrame(step);
    })(t0);
    setTimeout(() => { animating = false; pos = done ? done() : target.map(p => p.slice()); paint(); }, T + 60);
  }
  function hold(i){
    if (locked) return;
    pinned = i; camX = camY = 0; hotCol = null;
    tween(buildFocus(i), 700);
    if (opts.onHold) opts.onHold(i, linksOf(i));
  }
  function release(){
    if (pinned < 0) return;
    pinned = -1;
    tween(scaled(), 700, scaled);
    if (opts.onRelease) opts.onRelease();
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
  const last = new Map();
  function put(el, k, v){
    const key = el.__i + ':' + k;
    if (last.get(key) === v) return;
    last.set(key, v); el.style[k] = v;
  }
  function arcPts(ia, ib, steps){
    steps = steps || 14;
    const a = rot(raw.pos[ia]), b = rot(raw.pos[ib]);
    const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const om = Math.acos(dot), so = Math.sin(om), pts = []; let zs = 0;
    for (let k = 0; k <= steps; k++){
      const t = k / steps;
      const s1 = so < 1e-4 ? 1 - t : Math.sin((1 - t) * om) / so;
      const s2 = so < 1e-4 ? t : Math.sin(t * om) / so;
      const x = a[0] * s1 + b[0] * s2, y = a[1] * s1 + b[1] * s2, z = a[2] * s1 + b[2] * s2;
      const q = project(x * SR, y * SR, z * SR);
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

  /* ---------- the guides underneath ---------- */
  function paintFloor(){
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (fl.width !== innerWidth * dpr){ fl.width = innerWidth * dpr; fl.height = innerHeight * dpr; }
    fl.style.width = innerWidth + 'px'; fl.style.height = innerHeight + 'px';
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.clearRect(0, 0, innerWidth, innerHeight);
    if (!columns.length || pinned >= 0 || animating) return;
    columns.forEach(c => {
      const on = guideCol === c.key;
      const a = project(c.x - c.halfW, c.top, 0), b = project(c.x + c.halfW, c.bottom, 0);
      if (!a || !b) return;
      fx.lineWidth = 1;
      fx.strokeStyle = rgba(c.color, on ? .5 : .15);
      fx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      if (on){ fx.fillStyle = rgba(c.color, .07); fx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); }
    });
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
    const ln = focusI >= 0 && live(focusI) ? linksOf(focusI) : [];
    const kin = new Set(ln.map(l => l[0]));
    const globe = view === 'sphere' && pinned < 0 && !animating;
    const shrink = view === 'sphere' && pinned < 0 ? .72 : 1;
    const colSet = hotCol ? new Set((columns.find(c => c.key === hotCol) || { items: [] }).items) : null;
    guideCol = hotCol || (focusI >= 0 ? colOf[focusI] || null : null);

    DATA.map((_, i) => i).filter(i => P[i]).sort((a, b) => P[b].d - P[a].d).forEach(i => {
      const p = P[i], el = nodes[i], held = i === pinned, gone = !live(i);
      el.classList.toggle('mute', gone);
      if (gone){ put(el, 'opacity', '0'); return; }
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

      put(el, 'opacity', String(
        focusI >= 0 ? (i === focusI ? 1 : kin.has(i) ? .95 : far ? .1 : .24)
      : colSet ? (colSet.has(i) ? 1 : .2)
      : lit ? (hasMeaning(i, lit) ? 1 : .18)
      : far ? .3 : 1));

      /* NEVER negative. A child with a negative z-index paints behind its own
         positioned parent, which would put #world on top of every picture and
         make all 150 of them unhittable — no hover, no click, in any view. */
      put(el, 'zIndex', String(held ? 30000 : i === focusI ? 25000
        : (pinned >= 0 && kin.has(i)) ? 20000 : Math.max(1, 19000 - Math.round(p.d / 4))));
    });

    paintFloor();

    /* the resting threads — quiet, but the field is never empty */
    ctx.lineWidth = 1.4;
    EDGES.forEach(e => {
      const a = e[0], b = e[1], ma = e[3], mb = e[4];
      if (!edgeOk(a, b, ma, mb) || !live(a) || !live(b)) return;
      let pts;
      if (globe){ pts = arcPts(a, b); if (!pts) return; }
      else { if (!P[a] || !P[b]) return;
             if (view === 'timeline' && Math.abs(P[a].x - P[b].x) > innerWidth * 1.1) return;
             pts = [P[a], P[b]]; }
      let base = focusI < 0 ? .34 : .07;
      if (lit && focusI < 0) base = (ma === lit || mb === lit) ? .75 : .05;
      if (colSet && focusI < 0) base = (colSet.has(a) || colSet.has(b)) ? .6 : .05;
      ctx.strokeStyle = grad(pts[0], pts[pts.length - 1], META.mcol[ma], META.mcol[mb],
                             pts.back ? base * .3 : base);
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
        segs.push({ pts: pts, j: j, ma: l[1], mb: l[2], b: P[j] });
      });
      segs.forEach((sg, k) => {
        const on = k === hotLine;
        ctx.strokeStyle = on ? GOLD
          : grad(sg.pts[0], sg.pts[sg.pts.length - 1], META.mcol[sg.ma], META.mcol[sg.mb], .9);
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
      if (!c || animating || pinned >= 0){ el.style.opacity = 0; return; }
      const q = project(c.x, c.top, 0);
      if (!q){ el.style.opacity = 0; return; }
      el.textContent = c.label;
      /* a fixed distance above the block ON SCREEN, not in the world — a tall
         group would otherwise push its own name off the top of the window */
      el.style.transform = 'translate(' + q.x + 'px,' + (q.y - 22) + 'px) translate(-50%,-50%)';
      el.style.fontSize = Math.max(9, Math.min(15, 11 * q.s * 1.5)) + 'px';
      el.style.color = guideCol === c.key ? c.color : '';
      el.classList.toggle('lit', guideCol === c.key);
      el.style.opacity = (hotCol && hotCol !== c.key ? .25 : .85) * dim;
    });
    poleLabels.forEach(o => {
      if (!globe){ o.el.style.opacity = 0; return; }
      const r = rot(o.u), R = SR * 1.05, q = project(r[0] * R, r[1] * R, r[2] * R);
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
    const d = DATA[i], by = {}, keys = [];
    ln.forEach(l => {
      const m = l[2];
      if (!by[m]){ by[m] = { n: 0, color: META.mcol[m] }; keys.push(m); }
      by[m].n++;
    });
    keys.sort((a, b) => by[b].n - by[a].n);
    const max = keys.length ? by[keys[0]].n : 1;
    const bars = keys.map(k => {
      const r = by[k];
      return '<div class="brow"><i style="background:' + r.color + '"></i><u>' + k + '</u>' +
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
      '<div class="pie">' + (ln.length ? donut(keys.map(k => [by[k].color, by[k].n]), ln.length, 56) : '') +
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
    if (!columns.length || pinned >= 0 || animating) return null;
    for (let k = 0; k < columns.length; k++){
      const c = columns[k];
      const a = project(c.x - c.halfW, c.top, 0), b = project(c.x + c.halfW, c.bottom, 0);
      if (!a || !b) continue;
      if (mx < a.x - 10 || mx > b.x + 10) continue;
      /* grid columns are full-height strips: pick one anywhere down its length */
      if (view === 'grid') return c.key;
      if (my >= a.y - 42 && my <= b.y + 10) return c.key;
    }
    return null;
  }

  /* ---------- moving about ---------- */
  const inChrome = e => e.target && e.target.closest && e.target.closest('.chrome');
  addEventListener('mousedown', e => {
    if (inChrome(e)) return;
    downIdx = -1; downFace = null;
    drag = true; moved = false; scrollV = 0;
    lx = downX = e.clientX; ly = downY = e.clientY;
    document.body.classList.add('drag');
  }, true);                                   /* capture: before a node's own handler */
  addEventListener('mouseup', e => {
    drag = false; document.body.classList.remove('drag');
    if (moved || inChrome(e) || locked) return;
    if (downFace === 'back'){ release(); return; }
    /* trust the live hover over whatever was under the first pixel — growth on
       hover moves a picture's box between mousedown and mouseup */
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
      const s = focal / dist;
      if (view === 'sphere' && pinned < 0 && !animating){
        yaw += dx * .005;
        pitch = Math.max(-1.25, Math.min(1.25, pitch + dy * .004));
        pos = scaled();
      } else if (view === 'timeline' && pinned < 0 && !animating){
        scrollX -= dx / s;                    /* the strip runs by hand only */
        /* capped: one very fast move — a flick, or a pointer that jumps — should
           not fling the strip halfway round its loop */
        scrollV = Math.max(-140, Math.min(140, -dx / s));
        camY -= dy / s;
        pos = scaled();
      } else { camX -= dx / s; camY -= dy / s; }
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
    userZoom = true;
    dist = Math.max(900, Math.min(26000, dist * (e.deltaY > 0 ? 1.075 : .93)));
    paint();
  }, { passive: false });
  addEventListener('resize', () => { fit(); paint(); });

  /* ---------- the motion a view has of its own ---------- */
  function frame(){
    if (!running) return;
    if (pinned < 0 && !drag && !animating){
      if (view === 'sphere' && motion > 0){ yaw += motion * .0045; pos = scaled(); paint(); }
      else if (view === 'timeline'){
        if (Math.abs(scrollV) > .6){         /* coasting to a stop after a flick */
          scrollX += scrollV; scrollV *= .93; pos = scaled(); paint();
        } else if (locked && motion > 0){
          /* only behind the cover, where nothing can be dragged, does the strip
             run on its own — in the tool it moves when you move it */
          scrollX += motion * 16; pos = scaled(); paint();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  const wake = () => { if (!running){ running = true; requestAnimationFrame(frame); } };

  /* ---------- moving between views ---------- */
  function goTo(v){
    view = v; camX = camY = 0; pinned = -1; hotCol = null; userZoom = false;
    if (v === 'timeline') scrollX = 0;
    relayout();
    tween(scaled(), 950, scaled);
    wake();
    if (opts.onView) opts.onView(v);
  }
  function reSort(s){
    sort = s; pinned = -1; hotCol = null; userZoom = false;
    relayout();
    tween(scaled(), 820, scaled);
    if (opts.onSort) opts.onSort(s);
  }

  const api = {
    get view(){ return view; }, get sort(){ return sort; },
    get only(){ return only; }, get pinned(){ return pinned; }, get motion(){ return motion; },
    goTo: goTo, reSort: reSort, paint: paint, hold: hold, release: release,
    setOnly(m){ only = m; if (pinned >= 0 && !live(pinned)) pinned = -1; paint(); },
    setLit(m){ lit = m; paint(); },
    setMotion(v){ motion = v; if (v > 0) wake(); paint(); },
    hasMotion(){ return view === 'sphere'; },   /* the strip is pushed, not driven */
    reset(){ only = null; lit = null; paint(); },
    setLocked(v){ locked = v; if (v){ pinned = -1; hotCol = null; } },
    setInset(o){ Object.assign(inset, o); fit(); paint(); },
    ready(cb){
      let n = 0;
      const imgs = world.querySelectorAll('img');
      const tick = () => { if (++n >= imgs.length) cb(); };
      imgs.forEach(im => im.complete ? tick() : (im.onload = tick, im.onerror = tick));
      if (!imgs.length) cb();
    }
  };
  wake();
  paint();
  return api;
}

global.Loom = { mount: mount, VIEWS: VIEWS, VIEW_ORDER: VIEW_ORDER,
                SORTS: SORTS, SORT_ORDER: SORT_ORDER, SORT_NOTE: SORT_NOTE, ICON: ICON,
                familyOf: familyOf };
})(window);
