/* ==========================================================================
   editor — Panel 3: Micro-Editor (plantilla, tests JUnit, modal de solución)
   Port de la lógica original (legacy/AplicacionJAVA-original.html, 1392-1538)
   - Sin atributos inline: todos los listeners vía addEventListener.
   ========================================================================== */
import { EDITOR_ACTIVITIES } from '../data/activities.js';
import { t, isEs } from './i18n.js';
import { progress } from './state.js';
import { getLevelLabel, getBadgeClass } from './utils.js';
import { runEditorJUnit } from './runner/junit-runner.js';

let currentEditorFilter = 'all';
let currentEditorActId = 1;

function populateEditorSelect() {
  const sel = document.getElementById('select-editor-act');
  if (!sel) return;
  sel.innerHTML = '';
  const filtered = EDITOR_ACTIVITIES.filter(
    (a) => currentEditorFilter === 'all' || a.level === currentEditorFilter
  );
  filtered.forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a.id;
    const check = progress.editor[a.id] ? '✔ ' : '';
    const title = isEs() ? a.title_es : a.title_va;
    opt.textContent = `${check}${title} [${getLevelLabel(a.level)}]`;
    sel.appendChild(opt);
  });
  if (filtered.length > 0) {
    const exists = filtered.some((a) => a.id === currentEditorActId);
    sel.value = exists ? currentEditorActId : filtered[0].id;
  }
}

function setEditorFilter(lvl) {
  currentEditorFilter = lvl;
  ['all', 'easy', 'medium', 'hard'].forEach((l) => {
    const b = document.getElementById(`flt-edt-${l}`);
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
  populateEditorSelect();
  const filtered = EDITOR_ACTIVITIES.filter((a) => lvl === 'all' || a.level === lvl);
  if (filtered.length > 0) {
    const exists = filtered.some((a) => a.id === currentEditorActId);
    const nextId = exists ? currentEditorActId : filtered[0].id;
    selectEditorActivity(nextId, false);
  }
}

function onEditorActChange(val) {
  selectEditorActivity(parseInt(val, 10), false);
}

function selectEditorActivity(id, keepUserCode = false) {
  currentEditorActId = id;
  renderEditorActivity(id, keepUserCode);
}

function renderEditorActivity(id, keepUserCode = false) {
  const act = EDITOR_ACTIVITIES.find((a) => a.id === id);
  if (!act) return;

  const titleEl = document.getElementById('edt-act-title');
  if (titleEl) titleEl.textContent = isEs() ? act.title_es : act.title_va;
  const descEl = document.getElementById('edt-act-desc');
  if (descEl) descEl.textContent = isEs() ? act.desc_es : act.desc_va;

  const badge = document.getElementById('edt-level-badge');
  if (badge) {
    badge.textContent = getLevelLabel(act.level);
    badge.className = `text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getBadgeClass(act.level)}`;
  }

  const ta = document.getElementById('java-code-editor');
  if (ta && !keepUserCode) {
    ta.value = act.template;
  }

  const summary = document.getElementById('test-summary-badge');
  if (summary) {
    summary.textContent = `0/${act.tests.length} ${isEs() ? 'pasados' : 'passats'}`;
  }

  const term = document.getElementById('junit-terminal');
  if (term) {
    term.innerHTML = '';
    const placeholder = document.createElement('div');
    placeholder.className = 'text-ide-muted italic py-10 text-center';
    placeholder.textContent = t('junit_waiting');
    term.appendChild(placeholder);
  }
}

function clearEditorManual() {
  const act = EDITOR_ACTIVITIES.find((a) => a.id === currentEditorActId);
  const sig = act ? act.signature : 'void metodo()';
  const ta = document.getElementById('java-code-editor');
  if (!ta) return;
  ta.value =
`public class Solucion {
    public static ${sig} {
        // Escribe toda tu implementación a mano aquí:
        
    }
}`;
  ta.focus();
}

function restoreEditorTemplate() {
  const act = EDITOR_ACTIVITIES.find((a) => a.id === currentEditorActId);
  const ta = document.getElementById('java-code-editor');
  if (act && ta) {
    ta.value = act.template;
  }
}

/* --------------------------------------------------------------------------
   Modal de comparación de solución oficial
   -------------------------------------------------------------------------- */
function openSolutionModal() {
  const act = EDITOR_ACTIVITIES.find((a) => a.id === currentEditorActId);
  if (!act) return;

  const ta = document.getElementById('java-code-editor');
  const userCode = ta ? ta.value : '';
  const modal = document.getElementById('solution-modal');
  if (!modal) return;

  const methodBadge = document.getElementById('modal-method-badge');
  if (methodBadge) methodBadge.textContent = act.signature;
  const userPreview = document.getElementById('modal-user-preview');
  if (userPreview) userPreview.textContent = userCode || '// No has escrito código aún';
  const officialPreview = document.getElementById('modal-official-preview');
  if (officialPreview) officialPreview.textContent = act.officialSolution;

  const isCompleted = progress.editor[act.id];
  const statusBadge = document.getElementById('modal-user-status');
  if (statusBadge) {
    if (isCompleted) {
      statusBadge.textContent = isEs() ? '✔ Superado' : '✔ Superat';
      statusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-ide-success/20 text-ide-success font-bold';
    } else {
      statusBadge.textContent = isEs() ? 'En desarrollo' : 'En desenrotllament';
      statusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-ide-card text-ide-muted';
    }
  }

  modal.classList.remove('hidden');
}

function closeSolutionModal() {
  const modal = document.getElementById('solution-modal');
  if (modal) modal.classList.add('hidden');
}

function copyOfficialSolution() {
  const act = EDITOR_ACTIVITIES.find((a) => a.id === currentEditorActId);
  if (!act) return;
  navigator.clipboard?.writeText(act.officialSolution);
  const btn = document.getElementById('btn-copy-solution');
  if (!btn) return;
  btn.textContent = isEs() ? '✔ ¡Copiado!' : '✔ Copiat!';
  setTimeout(() => {
    btn.textContent = t('btn_copy_solution');
  }, 1800);
}

function applyOfficialSolutionToEditor() {
  const act = EDITOR_ACTIVITIES.find((a) => a.id === currentEditorActId);
  const ta = document.getElementById('java-code-editor');
  if (!act || !ta) return;
  ta.value = act.officialSolution;
  closeSolutionModal();
  ta.focus();
}

/* --------------------------------------------------------------------------
   Ejecución de la batería JUnit (guarda antirrebote)
   -------------------------------------------------------------------------- */
async function runEditorTests() {
  const btn = document.getElementById('btn-edt-run');
  if (!btn || btn.dataset.busy) return;
  const act = EDITOR_ACTIVITIES.find((a) => a.id === currentEditorActId);
  const ta = document.getElementById('java-code-editor');
  const term = document.getElementById('junit-terminal');
  if (!act || !ta || !term) return;

  btn.dataset.busy = '1';
  try {
    await runEditorJUnit(act, ta.value, term);
  } finally {
    delete btn.dataset.busy;
  }
}

/* --------------------------------------------------------------------------
   Wiring (sin atributos inline en el HTML)
   -------------------------------------------------------------------------- */
export function initEditor() {
  const sel = document.getElementById('select-editor-act');
  if (sel) sel.addEventListener('change', (e) => onEditorActChange(e.target.value));

  ['all', 'easy', 'medium', 'hard'].forEach((l) => {
    const b = document.getElementById(`flt-edt-${l}`);
    if (b) b.addEventListener('click', () => setEditorFilter(l));
  });

  const btnClear = document.getElementById('btn-edt-clear');
  if (btnClear) btnClear.addEventListener('click', clearEditorManual);

  const btnSolution = document.getElementById('btn-edt-solution');
  if (btnSolution) btnSolution.addEventListener('click', openSolutionModal);

  const btnRestore = document.getElementById('btn-edt-restore');
  if (btnRestore) btnRestore.addEventListener('click', restoreEditorTemplate);

  const btnRun = document.getElementById('btn-edt-run');
  if (btnRun) btnRun.addEventListener('click', runEditorTests);

  // Tab en el editor → 4 espacios
  const ta = document.getElementById('java-code-editor');
  if (ta) {
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
      }
    });
  }

  // Escape en todo el documento → cerrar modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSolutionModal();
  });

  // Botones del modal
  const btnModalX = document.getElementById('btn-modal-x');
  if (btnModalX) btnModalX.addEventListener('click', closeSolutionModal);
  const btnModalClose = document.getElementById('btn-modal-close');
  if (btnModalClose) btnModalClose.addEventListener('click', closeSolutionModal);
  const btnCopySolution = document.getElementById('btn-copy-solution');
  if (btnCopySolution) btnCopySolution.addEventListener('click', copyOfficialSolution);
  const btnModalApply = document.getElementById('btn-modal-apply');
  if (btnModalApply) btnModalApply.addEventListener('click', applyOfficialSolutionToEditor);

  populateEditorSelect();
  renderEditorActivity(currentEditorActId, false);
}

/** Re-render de la actividad actual conservando el código del alumno
    (lo usa app.js al entrar en el modo). */
export function renderCurrentEditor() {
  renderEditorActivity(currentEditorActId, true);
}

/* Listeners de módulo (se registran al importar).
   Al cambiar idioma se conserva el código escrito por el alumno
   (mejora sobre el original, que lo borraba). */
document.addEventListener('languagechange', () => {
  populateEditorSelect();
  renderEditorActivity(currentEditorActId, true);
});

document.addEventListener('progresschange', () => {
  populateEditorSelect();
});
