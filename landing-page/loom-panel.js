/* ------------------------------------------------------------------
   Loom — the controls.

   Two questions, asked in order, and a key:
     VIEW     the shape the pictures are laid into
     SORT BY  the order they are laid in — and, where a view groups,
              what it groups and names its columns by
     the nine meanings, which are what the lines mean

   Every control is the same object: a row you push along. One gesture
   for a choice and for a quantity, so there is nothing to learn twice.
------------------------------------------------------------------ */
(function (global) {
'use strict';

const clamp = v => Math.max(0, Math.min(1, v));

function row(label, cfg){
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rs';
  el.innerHTML = '<span class="rs-fill"></span><span class="rs-dots"></span>' +
                 '<span class="rs-lab"></span><span class="rs-val"></span>';
  const fill = el.querySelector('.rs-fill'), dots = el.querySelector('.rs-dots');
  const lab  = el.querySelector('.rs-lab'),  val  = el.querySelector('.rs-val');
  lab.textContent = label;

  const steps = cfg.steps, n = steps ? steps.length : 0;
  /* a discrete row is a stepper: option i owns the slice ending at (i+1)/n, so
     the first option still shows a fill and the last one fills the row */
  const idx = v => Math.max(0, Math.min(n - 1, Math.ceil(v * n) - 1));
  const snap = v => steps ? (idx(v) + 1) / n : v;
  const at = () => steps ? steps[idx(t)] : null;
  let t = 0, lastKey = null;

  function render(){
    const w = el.getBoundingClientRect().width;
    fill.style.width = (t * 100) + '%';
    /* the word only brightens once the fill has actually reached it */
    el.classList.toggle('covered', w > 0 && t * w > lab.offsetLeft + lab.offsetWidth + 4);
    val.textContent = steps ? at().label : cfg.fmt(t);
    const marks = steps ? n : 10;
    let h = '';
    for (let k = 1; k < marks; k++){
      const p = k / marks;
      if (p > t + .004) h += '<i style="left:' + (p * 100) + '%"></i>';
    }
    dots.innerHTML = h;
  }
  function set(v, fire){
    t = clamp(snap(clamp(v)));
    render();
    if (!fire) return;
    if (steps){ const k = at().key; if (k !== lastKey){ lastKey = k; cfg.onPick(k); } }
    else cfg.onInput(t);
  }

  const frac = e => {
    const r = el.getBoundingClientRect();
    return r.width ? (e.clientX - r.left) / r.width : 0;
  };
  el.addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.classList.add('live');
    set(frac(e), true);
  });
  el.addEventListener('pointermove', e => {
    if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) set(frac(e), true);
  });
  const done = () => el.classList.remove('live');
  el.addEventListener('pointerup', done);
  el.addEventListener('pointercancel', done);
  el.addEventListener('keydown', e => {
    const d = steps ? 1 / n : .05;
    if (e.key === 'ArrowLeft'){ set(t - d, true); e.preventDefault(); }
    else if (e.key === 'ArrowRight'){ set(t + d, true); e.preventDefault(); }
  });
  addEventListener('resize', render);

  el.pick = k => {                       /* set from outside, without firing back */
    const i = steps.findIndex(s => s.key === k);
    if (i < 0) return;
    lastKey = k; t = (i + 1) / n; render();
  };
  el.setT = v => { t = clamp(snap(v)); render(); };
  el.refresh = render;
  set(cfg.value == null ? 0 : cfg.value, false);
  if (steps) lastKey = at().key;
  return el;
}

/* ------------------------------------------------------------------ */
function build(host, loom, cfg){
  cfg = cfg || {};
  const add = n => (host.appendChild(n), n);
  const rule = () => { const d = document.createElement('div'); d.className = 'rule'; return d; };
  const sect = t => { const d = document.createElement('div'); d.className = 'sect';
                      d.textContent = t; return d; };

  const views = Loom.VIEW_ORDER.map(v => ({ key: v, label: Loom.VIEWS[v].label }));
  const sorts = Loom.SORT_ORDER.map(s => ({ key: s, label: Loom.SORTS[s] }));

  const vRow = add(row('View', {
    steps: views, value: (views.findIndex(v => v.key === loom.view) + 1) / views.length,
    onPick: v => loom.goTo(v)
  }));
  const sRow = add(row('Sort by', {
    steps: sorts, value: (sorts.findIndex(s => s.key === loom.sort) + 1) / sorts.length,
    onPick: s => loom.reSort(s)
  }));
  const mRow = add(row('Motion', {
    value: loom.motion, fmt: v => Math.round(v * 100) + '',
    onInput: v => loom.setMotion(v)
  }));
  mRow.classList.toggle('hide', !loom.hasMotion());

  /* ---- the key: the lines are the meanings ---- */
  add(rule());
  add(sect('What the lines mean'));
  const klist = add(document.createElement('div'));
  klist.className = 'klist';
  klist.innerHTML = META.meanings.map(m =>
    '<button class="btn chip" data-m="' + m + '"><i style="background:' + META.mcol[m] + '"></i>' +
    '<u>' + m + '</u><s>' + META.mcount[m] + '</s></button>').join('');
  const syncChips = () => klist.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('on', c.dataset.m === loom.only);
    c.classList.toggle('dim', !!loom.only && c.dataset.m !== loom.only);
  });
  klist.querySelectorAll('.chip').forEach(c => {
    c.onclick = e => { e.stopPropagation();
      loom.setOnly(loom.only === c.dataset.m ? null : c.dataset.m); syncChips(); };
    c.onmouseenter = () => { if (!loom.only) loom.setLit(c.dataset.m); };
    c.onmouseleave = () => loom.setLit(null);
  });

  const clear = add(document.createElement('button'));
  clear.className = 'btn quiet';
  clear.textContent = 'Show everything';
  clear.style.marginTop = '11px';
  clear.onclick = e => { e.stopPropagation(); loom.reset(); syncChips(); };

  return {
    onView(v){ vRow.pick(v); mRow.classList.toggle('hide', !loom.hasMotion()); },
    onSort(s){ sRow.pick(s); },
    refresh(){ vRow.refresh(); sRow.refresh(); mRow.refresh(); }
  };
}

global.Panel = { build: build, row: row };
})(window);
