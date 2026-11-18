/* ==========================================================================
   parsons — Panel 2: Puzzle Parsons (banco → target con indentación)
   Port de la lógica original (legacy/AplicacionJAVA-original.html, 1157-1339)
   - Sin atributos inline: los ítems y botones se crean con createElement y
     addEventListener.
   ========================================================================== */
import { PARSONS_ACTIVITIES } from '../data/activities.js';
import { isEs } from './i18n.js';
import { progress, markCompleted } from './state.js';
import { escapeHtml, getLevelLabel, getBadgeClass } from './utils.js';
import { compileParsonsSolution } from './runner/parsons-compile.js';

let currentParsonsFilter = 'all';
let currentParsonsActId = 1;
let parsonsBank = [];
let parsonsTarget = [];

function populateParsonsSelect() {
  const sel = document.getElementById('select-parsons-act');
  if (!sel) return;
  sel.innerHTML = '';
  const filtered = PARSONS_ACTIVITIES.filter(
    (a) => currentParsonsFilter === 'all' || a.level === currentParsonsFilter
  );
  filtered.forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a.id;
    const check = progress.parsons[a.id] ? '✔ ' : '';
    const title = isEs() ? a.title_es : a.title_va;
    opt.textContent = `${check}${title} [${getLevelLabel(a.level)}]`;
    sel.appendChild(opt);
  });
  if (filtered.length > 0) {
    const exists = filtered.some((a) => a.id === currentParsonsActId);
    sel.value = exists ? currentParsonsActId : filtered[0].id;
  }
}

function setParsonsFilter(lvl) {
  currentParsonsFilter = lvl;
  ['all', 'easy', 'medium', 'hard'].forEach((l) => {
    const b = document.getElementById(`flt-par-${l}`);
    if (b) {
      if (l === lvl) {
        b.className = 'px-2.5 py-1 rounded bg-ide-surface text-ide-heading font-bold';
      } else {
        const col =
          l === 'easy' ? 'text-ide-success' : l === 'medium' ? 'text-ide-warning' : l === 'hard' ? 'text-ide-danger' : 'text-ide-muted';
        b.className = `px-2.5 py-1 rounded ${col} hover:bg-ide-surface`;
      }
    }
  });
  populateParsonsSelect();
  const filtered = PARSONS_ACTIVITIES.filter((a) => lvl === 'all' || a.level === lvl);
  if (filtered.length > 0) {
    const exists = filtered.some((a) => a.id === currentParsonsActId);
    const nextId = exists ? currentParsonsActId : filtered[0].id;
    selectParsonsActivity(nextId);
  }
}

function onParsonsActChange(val) {
  selectParsonsActivity(parseInt(val, 10));
}

function selectParsonsActivity(id) {
  currentParsonsActId = id;
  renderParsonsActivity(id);
}

function resetParsonsCurrent() {
  renderParsonsActivity(currentParsonsActId);
}

function renderParsonsActivity(id) {
  const act = PARSONS_ACTIVITIES.find((a) => a.id === id);
  if (!act) return;

  const titleEl = document.getElementById('par-act-title');
  if (titleEl) titleEl.textContent = isEs() ? act.title_es : act.title_va;
  const descEl = document.getElementById('par-act-desc');
  if (descEl) descEl.textContent = isEs() ? act.desc_es : act.desc_va;

  const badge = document.getElementById('par-level-badge');
  if (badge) {
    badge.textContent = getLevelLabel(act.level);
    badge.className = `text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getBadgeClass(act.level)}`;
  }

  const items = [
    ...act.correctLines.map((l, idx) => ({ id: `c_${idx}`, text: l.text.trim(), indent: 0, isDistractor: false })),
    ...act.distractors.map((d, idx) => ({ id: `d_${idx}`, text: d.text.trim(), indent: 0, isDistractor: true }))
  ];
  parsonsBank = items.sort(() => 0.5 - Math.random());
  parsonsTarget = [];

  const fb = document.getElementById('parsons-feedback');
  if (fb) fb.classList.add('hidden');
  renderParsonsUI();
}

function makeIndentBtn(label, title, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'px-1.5 py-0.5 rounded bg-ide-card hover:bg-ide-card/80 text-[10px] text-ide-muted';
  b.title = title;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function renderParsonsUI() {
  const bankDiv = document.getElementById('parsons-bank');
  if (bankDiv) {
    bankDiv.innerHTML = '';
    parsonsBank.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className =
        'p-2.5 rounded-lg bg-ide-card hover:bg-ide-card/80 border border-ide-border cursor-pointer text-xs font-mono text-ide-warning flex items-center justify-between transition-all';
      div.innerHTML = `<span>${escapeHtml(item.text)}</span> <span class="text-xs text-ide-link">➡</span>`;
      div.addEventListener('click', () => {
        parsonsTarget.push({ ...item, indent: 0 });
        parsonsBank.splice(idx, 1);
        renderParsonsUI();
      });
      bankDiv.appendChild(div);
    });
  }

  const targetDiv = document.getElementById('parsons-target');
  if (!targetDiv) return;
  targetDiv.innerHTML = '';

  if (parsonsTarget.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'h-full flex items-center justify-center text-xs text-ide-muted italic py-12';
    empty.textContent = isEs()
      ? 'Haz clic en las líneas de la izquierda para transferirlas aquí.'
      : "Fes clic en les línies de l'esquerra per a transferir-les ací.";
    targetDiv.appendChild(empty);
    return;
  }

  parsonsTarget.forEach((item, idx) => {
    const div = document.createElement('div');
    const indentPx = (item.indent || 0) * 24;
    div.className = 'p-2 rounded-lg bg-ide-surface border border-ide-border text-xs font-mono text-ide-success flex items-center justify-between transition-all';
    div.style.marginLeft = `${indentPx}px`;

    const left = document.createElement('div');
    left.className = 'flex items-center gap-2 overflow-x-auto';
    const num = document.createElement('span');
    num.className = 'text-[10px] text-ide-muted';
    num.textContent = String(idx + 1);
    const txt = document.createElement('span');
    txt.textContent = item.text;
    left.appendChild(num);
    left.appendChild(txt);

    const right = document.createElement('div');
    right.className = 'flex items-center gap-1';
    right.appendChild(makeIndentBtn('-', 'Menos sangría', () => changeParsonsIndent(idx, -1)));
    right.appendChild(makeIndentBtn('+', 'Más sangría', () => changeParsonsIndent(idx, 1)));
    const rmBtn = document.createElement('button');
    rmBtn.type = 'button';
    rmBtn.className = 'text-ide-danger hover:text-ide-danger px-1 text-sm';
    rmBtn.textContent = '✕';
    rmBtn.addEventListener('click', () => removeParsonsFromTarget(idx));
    right.appendChild(rmBtn);

    div.appendChild(left);
    div.appendChild(right);
    targetDiv.appendChild(div);
  });
}

function changeParsonsIndent(idx, delta) {
  if (!parsonsTarget[idx]) return;
  const cur = parsonsTarget[idx].indent || 0;
  parsonsTarget[idx].indent = Math.max(0, Math.min(3, cur + delta));
  renderParsonsUI();
}

function removeParsonsFromTarget(idx) {
  const removed = parsonsTarget.splice(idx, 1)[0];
  if (removed) parsonsBank.push(removed);
  renderParsonsUI();
}

function checkParsonsSolution() {
  const act = PARSONS_ACTIVITIES.find((a) => a.id === currentParsonsActId);
  const fb = document.getElementById('parsons-feedback');
  if (!fb) return;
  fb.classList.remove('hidden');

  if (!act) return;

  if (parsonsTarget.length !== act.correctLines.length) {
    fb.className = 'p-3 rounded-xl border border-ide-danger/30 bg-ide-danger/10 text-xs font-mono text-ide-danger';
    fb.textContent = isEs()
      ? `❌ El algoritmo debe tener exactamente ${act.correctLines.length} líneas. Asegúrate de descartar las líneas trampa.`
      : `❌ L'algorisme ha de tindre exactament ${act.correctLines.length} línies. Assegura't de descartar les línies trampa.`;
    return;
  }

  let ok = true;
  let errReason = '';

  for (let i = 0; i < act.correctLines.length; i++) {
    const exp = act.correctLines[i];
    const user = parsonsTarget[i];

    if (user.isDistractor) {
      ok = false;
      errReason = isEs()
        ? `Has incluido una línea trampa: "${user.text}"`
        : `Has inclòs una línia trampa: "${user.text}"`;
      break;
    }

    if (user.text !== exp.text.trim()) {
      ok = false;
      errReason = isEs()
        ? `Error en la línea ${i + 1}: el orden del código no es correcto.`
        : `Error en la línia ${i + 1}: l'orde del codi no és correcte.`;
      break;
    }
  }

  if (ok) {
    fb.className = 'p-3 rounded-xl border border-ide-success/30 bg-ide-success/10 text-xs font-mono text-ide-success';
    fb.textContent = isEs()
      ? '✔ ¡Puzzle Parsons resuelto correctamente! Código compilable e indentado.'
      : '✔ Puzzle Parsons resolt correctament! Codi compilable i indentat.';
    markCompleted('parsons', act.id); // persiste + despacha 'progresschange' → repuebla el select con ✔
  } else {
    fb.className = 'p-3 rounded-xl border border-ide-danger/30 bg-ide-danger/10 text-xs font-mono text-ide-danger';
    fb.textContent = `❌ ${errReason}`;
  }
}

async function compileParsons() {
  const btn = document.getElementById('btn-par-compile');
  if (!btn || btn.dataset.busy) return;
  const act = PARSONS_ACTIVITIES.find((a) => a.id === currentParsonsActId);
  const fb = document.getElementById('parsons-feedback');
  if (!act || !fb) return;

  btn.dataset.busy = '1';
  try {
    await compileParsonsSolution(act, parsonsTarget, fb);
  } finally {
    delete btn.dataset.busy;
  }
}

/* --------------------------------------------------------------------------
   Wiring (sin atributos inline en el HTML)
   -------------------------------------------------------------------------- */
export function initParsons() {
  const sel = document.getElementById('select-parsons-act');
  if (sel) sel.addEventListener('change', (e) => onParsonsActChange(e.target.value));

  ['all', 'easy', 'medium', 'hard'].forEach((l) => {
    const b = document.getElementById(`flt-par-${l}`);
    if (b) b.addEventListener('click', () => setParsonsFilter(l));
  });

  const btnReset = document.getElementById('btn-par-reset');
  if (btnReset) btnReset.addEventListener('click', resetParsonsCurrent);

  const btnCheck = document.getElementById('btn-par-check');
  if (btnCheck) btnCheck.addEventListener('click', checkParsonsSolution);

  const btnCompile = document.getElementById('btn-par-compile');
  if (btnCompile) btnCompile.addEventListener('click', compileParsons);

  populateParsonsSelect();
  renderParsonsActivity(currentParsonsActId);
}

/** Re-render de la actividad actual (lo usa app.js al entrar en el modo). */
export function renderCurrentParsons() {
  renderParsonsActivity(currentParsonsActId);
}

/* Listeners de módulo (se registran al importar). */
document.addEventListener('languagechange', () => {
  populateParsonsSelect();
  renderParsonsActivity(currentParsonsActId);
});

document.addEventListener('progresschange', () => {
  populateParsonsSelect();
});
