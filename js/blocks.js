/* ==========================================================================
   blocks — Panel 1: Bloques (paleta → workspace → compilar/ejecutar)
   Port de la lógica original (legacy/AplicacionJAVA-original.html, 954-1119)
   - Sin atributos inline (onclick...): listeners vía addEventListener.
   - El visor #blocks-java-code usa buildMainSource(blockWorkspace) como única
     fuente de verdad (renderWorkspaceUI lo actualiza).
   ========================================================================== */
import { BLOCK_ACTIVITIES } from '../data/activities.js';
import { t, isEs } from './i18n.js';
import { progress } from './state.js';
import { escapeHtml, getLevelLabel, getBadgeClass } from './utils.js';
import { buildMainSource, runBlockProgram } from './runner/blocks-runner.js';

let currentBlockFilter = 'all';
let currentBlockActId = 1;
let blockWorkspace = [];

function populateBlockSelect() {
  const sel = document.getElementById('select-block-act');
  if (!sel) return;
  sel.innerHTML = '';
  const filtered = BLOCK_ACTIVITIES.filter(
    (a) => currentBlockFilter === 'all' || a.level === currentBlockFilter
  );
  filtered.forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a.id;
    const check = progress.blocks[a.id] ? '✔ ' : '';
    const title = isEs() ? a.title_es : a.title_va;
    opt.textContent = `${check}${title} [${getLevelLabel(a.level)}]`;
    sel.appendChild(opt);
  });
  if (filtered.length > 0) {
    const exists = filtered.some((a) => a.id === currentBlockActId);
    sel.value = exists ? currentBlockActId : filtered[0].id;
  }
}

function setBlockFilter(lvl) {
  currentBlockFilter = lvl;
  ['all', 'easy', 'medium', 'hard'].forEach((l) => {
    const b = document.getElementById(`flt-blk-${l}`);
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
  populateBlockSelect();
  const filtered = BLOCK_ACTIVITIES.filter((a) => lvl === 'all' || a.level === lvl);
  if (filtered.length > 0) {
    const exists = filtered.some((a) => a.id === currentBlockActId);
    const nextId = exists ? currentBlockActId : filtered[0].id;
    selectBlockActivity(nextId);
  }
}

function onBlockActChange(val) {
  selectBlockActivity(parseInt(val, 10));
}

function selectBlockActivity(id) {
  currentBlockActId = id;
  blockWorkspace = [];
  renderBlockActivity(id);
}

function renderBlockActivity(id) {
  const act = BLOCK_ACTIVITIES.find((a) => a.id === id);
  if (!act) return;

  const titleEl = document.getElementById('blk-act-title');
  if (titleEl) titleEl.textContent = isEs() ? act.title_es : act.title_va;
  const descEl = document.getElementById('blk-act-desc');
  if (descEl) descEl.textContent = isEs() ? act.desc_es : act.desc_va;
  const outEl = document.getElementById('blk-target-output');
  if (outEl) outEl.textContent = act.expected;

  const badge = document.getElementById('blk-level-badge');
  if (badge) {
    badge.textContent = getLevelLabel(act.level);
    badge.className = `text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getBadgeClass(act.level)}`;
  }

  const palContainer = document.getElementById('palette-container');
  if (palContainer) {
    palContainer.innerHTML = '';
    act.palette.forEach((item) => {
      const div = document.createElement('div');
      div.className =
        'p-2.5 rounded-lg bg-ide-bg hover:bg-ide-card border border-ide-border cursor-pointer transition-all flex items-center justify-between text-xs font-mono text-ide-warning hover:border-ide-warning/50';
      div.innerHTML = `<span>${escapeHtml(item.text)}</span> <span class="text-ide-link text-sm">➕</span>`;
      div.addEventListener('click', () => addBlockToWorkspace(item));
      palContainer.appendChild(div);
    });
  }

  renderWorkspaceUI();
}

function addBlockToWorkspace(block) {
  blockWorkspace.push(block);
  renderWorkspaceUI();
}

function removeBlockFromWorkspace(idx) {
  blockWorkspace.splice(idx, 1);
  renderWorkspaceUI();
}

function clearBlockWorkspace() {
  blockWorkspace = [];
  renderWorkspaceUI();
}

function renderWorkspaceUI() {
  const counter = document.getElementById('blk-counter');
  if (counter) counter.textContent = `(${blockWorkspace.length} ${isEs() ? 'bloques' : 'blocs'})`;

  const codeEl = document.getElementById('blocks-java-code');
  if (codeEl) codeEl.textContent = buildMainSource(blockWorkspace);

  const ws = document.getElementById('workspace-container');
  if (!ws) return;
  ws.innerHTML = '';

  if (blockWorkspace.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'h-full flex items-center justify-center text-xs text-ide-muted italic py-6';
    empty.textContent = t('blocks_empty_ws');
    ws.appendChild(empty);
    return;
  }

  blockWorkspace.forEach((b, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 rounded bg-ide-card border border-ide-border text-xs font-mono text-ide-success';
    row.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-ide-muted">${idx + 1}</span>
              <span>${escapeHtml(b.code)}</span>
            </div>
          `;
    const rmBtn = document.createElement('button');
    rmBtn.type = 'button';
    rmBtn.className = 'text-ide-danger hover:text-ide-danger text-sm px-1.5';
    rmBtn.textContent = '✕';
    rmBtn.addEventListener('click', () => removeBlockFromWorkspace(idx));
    row.appendChild(rmBtn);
    ws.appendChild(row);
  });
}

function copyGeneratedBlockCode() {
  const code = document.getElementById('blocks-java-code');
  if (!code) return;
  navigator.clipboard?.writeText(code.textContent);
}

async function runBlocks() {
  const btn = document.getElementById('btn-run-blocks');
  if (!btn || btn.dataset.busy) return;
  const act = BLOCK_ACTIVITIES.find((a) => a.id === currentBlockActId);
  const term = document.getElementById('blocks-terminal');
  if (!act || !term) return;

  btn.dataset.busy = '1';
  try {
    await runBlockProgram(act, blockWorkspace, term);
  } finally {
    delete btn.dataset.busy;
  }
}

/* --------------------------------------------------------------------------
   Wiring (sin atributos inline en el HTML)
   -------------------------------------------------------------------------- */
export function initBlocks() {
  const sel = document.getElementById('select-block-act');
  if (sel) sel.addEventListener('change', (e) => onBlockActChange(e.target.value));

  ['all', 'easy', 'medium', 'hard'].forEach((l) => {
    const b = document.getElementById(`flt-blk-${l}`);
    if (b) b.addEventListener('click', () => setBlockFilter(l));
  });

  const btnClear = document.getElementById('btn-ws-clear');
  if (btnClear) btnClear.addEventListener('click', clearBlockWorkspace);

  const btnCopy = document.getElementById('btn-copy-code');
  if (btnCopy) btnCopy.addEventListener('click', copyGeneratedBlockCode);

  const btnRun = document.getElementById('btn-run-blocks');
  if (btnRun) btnRun.addEventListener('click', runBlocks);

  populateBlockSelect();
  renderBlockActivity(currentBlockActId);
}

/* Listeners de módulo (se registran al importar). Los textos estáticos ya los
   pinta el setLanguage genérico vía [data-i18n]. */
document.addEventListener('languagechange', () => {
  populateBlockSelect();
  renderBlockActivity(currentBlockActId);
});

document.addEventListener('progresschange', () => {
  populateBlockSelect();
});
