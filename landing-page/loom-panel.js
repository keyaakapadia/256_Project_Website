/* ------------------------------------------------------------------
   Loom — the controls.

   Two questions and a key, asked in order:
     VIEW                  the shape the pictures are laid into
     SORT BY               the order they are laid in — and, where a view
                           groups, what it groups and names its columns by
     WHAT THE LINES MEAN   the nine meanings, which are what the lines are

   All three are the same object: a tray with pills in it. The tray
   carries the affordance, so only the chosen pill is ever raised, and
   there is nothing to learn twice.
------------------------------------------------------------------ */
(function (global) {
'use strict';

function tray(cls, items, isOn, onPick){
  const el = document.createElement('div');
  el.className = 'tray ' + cls;
  el.innerHTML = items.map(it =>
    '<button class="pill" type="button" data-k="' + it.key + '">' + it.html + '</button>').join('');
  el.querySelectorAll('.pill').forEach(b =>
    b.onclick = e => { e.stopPropagation(); onPick(b.dataset.k, b); });
  el.sync = () => el.querySelectorAll('.pill').forEach(b => b.classList.toggle('on', isOn(b.dataset.k)));
  el.sync();
  return el;
}

function section(cls, title){
  const el = document.createElement('section');
  el.className = 'sec ' + cls;
  const h = document.createElement('div');
  h.className = 'sect'; h.textContent = title;
  el.appendChild(h);
  return el;
}

/* ------------------------------------------------------------------ */
function build(host, loom){
  host.classList.add('stack');

  /* ---- 1. decide a view ---- */
  const vSec = host.appendChild(section('view', 'View'));
  const vTray = vSec.appendChild(tray('one',
    Loom.VIEW_ORDER.map(v => ({ key: v,
      html: '<svg viewBox="0 0 20 20">' + Loom.ICON[v] + '</svg><u>' + Loom.VIEWS[v].label + '</u>' })),
    k => k === loom.view,
    k => loom.goTo(k)));

  /* ---- 2. then an order, which is also what a grouped view names by ---- */
  const sSec = host.appendChild(section('sort', 'Sort by'));
  const sTray = sSec.appendChild(tray('three centre',
    Loom.SORT_ORDER.map(s => ({ key: s, html: '<u>' + Loom.SORTS[s] + '</u>' })),
    k => k === loom.sort,
    k => loom.reSort(k)));
  const note = sSec.appendChild(document.createElement('p'));
  note.className = 'note';
  note.textContent = Loom.SORT_NOTE[loom.sort];

  /* ---- 3. the key: the lines are the meanings ---- */
  const kSec = host.appendChild(section('key', 'What the lines mean'));
  const kTray = kSec.appendChild(tray('three',
    META.meanings.map(m => ({ key: m,
      html: '<i style="background:' + META.mcol[m] + '"></i><u>' + m + '</u>' +
            '<s>' + META.mcount[m] + '</s>' })),
    k => k === loom.only,
    k => { loom.setOnly(loom.only === k ? null : k); syncKey(); }));
  function syncKey(){
    kTray.sync();
    kTray.querySelectorAll('.pill').forEach(b =>
      b.classList.toggle('dim', !!loom.only && b.dataset.k !== loom.only));
  }
  kTray.querySelectorAll('.pill').forEach(b => {
    b.onmouseenter = () => { if (!loom.only) loom.setLit(b.dataset.k); };
    b.onmouseleave = () => loom.setLit(null);
  });

  /* ---- 4. the foot, held to the bottom of whatever height it is given ---- */
  const foot = host.appendChild(document.createElement('div'));
  foot.className = 'foot';
  const clear = foot.appendChild(document.createElement('button'));
  clear.type = 'button';
  clear.className = 'quiet';
  clear.textContent = 'Show everything';
  clear.onclick = e => { e.stopPropagation(); loom.reset(); syncKey(); };

  return {
    foot: foot,
    onView(){ vTray.sync(); },
    onSort(s){ sTray.sync(); note.textContent = Loom.SORT_NOTE[s]; }
  };
}

global.Panel = { build: build, tray: tray };
})(window);
