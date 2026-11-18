/* ==========================================================================
   app — orquestador de la aplicación
   - Arranque, cambio de modo (Bloques / Parsons / Micro-Editor) e idioma.
   - Registra el Service Worker (https o localhost) de forma silenciosa.
   ========================================================================== */
import { setLanguage } from './i18n.js';
import { loadProgress } from './state.js';
import { initBlocks } from './blocks.js';
import { initParsons, renderCurrentParsons } from './parsons.js';
import { initEditor, renderCurrentEditor } from './editor.js';

let currentMode = 'blocks';

/* --------------------------------------------------------------------------
   Cambio de modos / pestañas principales (port literal del original)
   -------------------------------------------------------------------------- */
export function switchMode(mode) {
  currentMode = mode;
  ['blocks', 'parsons', 'editor'].forEach((m) => {
    const btn = document.getElementById(`btn-mode-${m}`);
    const panel = document.getElementById(`panel-${m}`);
    if (!btn || !panel) return;
    if (m === mode) {
      panel.classList.remove('hidden');
      btn.className =
        'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 bg-ide-accent text-slate-900 shadow font-bold';
    } else {
      panel.classList.add('hidden');
      btn.className = 'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-ide-muted hover:text-white';
    }
  });
  if (mode === 'parsons') renderCurrentParsons();
  if (mode === 'editor') renderCurrentEditor();
}

/* --------------------------------------------------------------------------
   Inicialización
   -------------------------------------------------------------------------- */
function initApp() {
  loadProgress();

  initBlocks();
  initParsons();
  initEditor();

  const btnEs = document.getElementById('btn-lang-es');
  if (btnEs) btnEs.addEventListener('click', () => setLanguage('es'));
  const btnVa = document.getElementById('btn-lang-va');
  if (btnVa) btnVa.addEventListener('click', () => setLanguage('va'));

  ['blocks', 'parsons', 'editor'].forEach((m) => {
    const btn = document.getElementById(`btn-mode-${m}`);
    if (btn) btn.addEventListener('click', () => switchMode(m));
  });

  setLanguage('es');
  switchMode('blocks');

  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))
  ) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') {
  addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
