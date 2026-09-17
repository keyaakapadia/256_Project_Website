/* ------------------------------------------------------------------
   Loom — the control panel, shared by both drafts.

   Read top to bottom it asks two questions in order:
     decide a VIEW  — the shape the pictures are laid into
     then SORT BY   — the order they are laid in
   and then hands over the sliders, so nothing needs a steady hand.
------------------------------------------------------------------ */
(function (global) {
'use strict';

function seg(items, current, onPick){
  const el = document.createElement('div');
  el.className = 'seg';
  el.innerHTML = items.map(it =>
    '<button class="btn' + (it.key === current ? ' on' : '') + '" data-k="' + it.key + '">' +
    (it.icon ? '<svg viewBox="0 0 20 20">' + it.icon + '</svg>' : '') + it.label + '</button>').join('');
  el.querySelectorAll('.btn').forEach(b => b.onclick = e => {
    e.stopPropagation();
    el.querySelectorAll('.btn').forEach(o => o.classList.toggle('on', o === b));
    onPick(b.dataset.k);
  });
  el.pick = k => el.querySelectorAll('.btn').forEach(o => o.classList.toggle('on', o.dataset.k === k));
  return el;
}

function slider(label, value, onInput, fmt){
  const el = document.createElement('div');
  el.className = 'sld';
  el.innerHTML = '<label>' + label + '</label><input type="range" min="0" max="1" step="0.01">' +
                 '<output></output>';
  const inp = el.querySelector('input'), out = el.querySelector('output');
  const show = v => out.textContent = fmt ? fmt(v) : Math.round(v * 100) + '';
  inp.value = value; show(+value);
  inp.addEventListener('input', () => { show(+inp.value); onInput(+inp.value); });
  el.set = v => { inp.value = v; show(+v); };
  return el;
}

function section(title, note){
  const el = document.createElement('div');
  el.className = 'sect';
  el.innerHTML = '<span>' + title + '</span>' + (note ? '<em></em>' : '');
  el.note = t => { const e = el.querySelector('em'); if (e) e.textContent = t; };
  return el;
}

/* ------------------------------------------------------------------ */
function build(host, loom, cfg){
  cfg = cfg || {};
  const add = n => (host.appendChild(n), n);
  const wrap = (...kids) => { const d = document.createElement('div');
    kids.forEach(k => d.appendChild(k)); return d; };
  const rule = () => { const d = document.createElement('div'); d.className = 'rule'; return d; };

  /* ---- 1. decide a view ---- */
  add(section('View'));
  const views = add(seg(Loom.VIEW_ORDER.map(v =>
    ({ key: v, label: Loom.VIEWS[v].label, icon: Loom.ICON[v] })), loom.view, v => {
      loom.goTo(v);
    }));

  /* ---- 2. then sort by ---- */
  const sortHead = add(section('Sort by', true));
  sortHead.note(Loom.SORT_NOTE[loom.sort]);
  const sorts = add(seg(Loom.SORT_ORDER.map(s => ({ key: s, label: Loom.SORTS[s] })), loom.sort, s => {
    loom.reSort(s); sortHead.note(Loom.SORT_NOTE[s]);
  }));

  /* ---- 3. sliders, so none of it needs a steady hand ---- */
  let zoomS, turnS;
  if (cfg.sliders !== false){
    add(rule());
    const sl = document.createElement('div');
    sl.className = 'sliders';
    zoomS = slider('Zoom', loom.zoomT(), v => loom.setZoom(v));
    const spreadS = slider('Spread', .5, v => loom.setSpread(.7 + v * .6));
    const thrS = slider('Threads', 1, v => loom.setThreads(v));
    turnS = slider('Turn', loom.turnT(), v => loom.setTurn(v), v => Math.round(v * 360) + '°');
    [zoomS, spreadS, thrS, turnS].forEach(s => sl.appendChild(s));
    add(sl);
    turnS.classList.toggle('hide', loom.view !== 'sphere');
  }

  /* ---- 4. the key: the lines are the meanings ---- */
  add(rule());
  add(section('What the lines mean'));
  const klist = document.createElement('div');
  klist.className = 'klist';
  klist.innerHTML = META.meanings.map(m =>
    '<button class="btn chip" data-m="' + m + '"><i style="background:' + META.mcol[m] + '"></i>' +
    '<u>' + m + '</u><s>' + META.mcount[m] + '</s></button>').join('');
  add(klist);
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

  /* ---- 5. the rest of the filters ---- */
  add(rule());
  const pills = (label, items, isOn, toggle) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = '<span class="lab">' + label + '</span><div class="pills">' +
      items.map(it => '<button class="btn fbtn" data-k="' + it.key + '">' + it.label + '</button>').join('') +
      '</div>';
    const sync = () => row.querySelectorAll('.fbtn').forEach(b => b.classList.toggle('off', !isOn(b.dataset.k)));
    row.querySelectorAll('.fbtn').forEach(b => b.onclick = e => {
      e.stopPropagation(); toggle(b.dataset.k); sync();
    });
    row.sync = sync; sync();
    return row;
  };
  const seen = add(pills('Seen', META.freqBuckets.map((f, k) => ({ key: String(k), label: f })),
    k => loom.hasFreq(+k), k => loom.toggleFreq(+k)));
  seen.style.marginBottom = '9px';
  const tied = add(pills('Tied by', META.kinds.map(k => ({ key: k, label: META.kindLabel[k] })),
    k => loom.hasKind(k), k => loom.toggleKind(k)));

  const clear = add(document.createElement('button'));
  clear.className = 'btn quiet';
  clear.textContent = 'Show everything';
  clear.style.marginTop = '10px';
  clear.onclick = e => {
    e.stopPropagation();
    loom.reset(); syncChips(); seen.sync(); tied.sync();
    if (zoomS) zoomS.set(loom.zoomT());
  };

  return {
    onView(v){
      views.pick(v);
      if (zoomS) zoomS.set(loom.zoomT());
      if (turnS) turnS.classList.toggle('hide', v !== 'sphere');
    },
    onZoom(){ if (zoomS) zoomS.set(loom.zoomT()); },
    pickView: v => views.pick(v),
    pickSort: s => { sorts.pick(s); sortHead.note(Loom.SORT_NOTE[s]); }
  };
}

global.Panel = { build: build, seg: seg, slider: slider, section: section };
})(window);
