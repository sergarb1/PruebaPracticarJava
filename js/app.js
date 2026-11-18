/* ==========================================================================
   app — orquestador de la aplicación
   - Arranque, cambio de modo (Inicio / Bloques / Parsons / Micro-Editor),
     tema claro-oscuro e idioma.
   - Registra el Service Worker (https o localhost) de forma silenciosa.
   ========================================================================== */
import { setLanguage, t } from './i18n.js';
import { loadProgress } from './state.js';
import { initBlocks } from './blocks.js';
import { initParsons, renderCurrentParsons } from './parsons.js';
import { initEditor, renderCurrentEditor } from './editor.js';
import { initHome } from './home.js';

const MODES = ['home', 'blocks', 'parsons', 'editor'];
const BTN_BASE = 'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5';
const BTN_ACTIVE = `${BTN_BASE} bg-ide-accent text-slate-900 shadow font-bold`;
const BTN_IDLE = `${BTN_BASE} text-ide-muted hover:text-ide-heading`;

let currentMode = 'home';

/* --------------------------------------------------------------------------
   Cambio de modos / pestañas principales
   -------------------------------------------------------------------------- */
export function switchMode(mode) {
  if (!MODES.includes(mode)) mode = 'blocks';
  currentMode = mode;

  MODES.forEach((m) => {
    const btn = document.getElementById(`btn-mode-${m}`);
    const panel = document.getElementById(`panel-${m}`);
    if (!btn || !panel) return;
    if (m === mode) {
      panel.classList.remove('hidden');
      btn.className = BTN_ACTIVE;
      panel.classList.remove('panel-in');
      void panel.offsetWidth; /* reinicia la animación */
      panel.classList.add('panel-in');
    } else {
      panel.classList.add('hidden');
      btn.className = BTN_IDLE;
    }
  });

  if (mode === 'parsons') renderCurrentParsons();
  if (mode === 'editor') renderCurrentEditor();

  /* La landing se mostró al menos una vez: a partir de ahora abre en ejercicios */
  try { localStorage.setItem('javalearn_dam_seen', '1'); } catch (e) { /* sin storage */ }
}

export function getCurrentMode() { return currentMode; }

/* --------------------------------------------------------------------------
   Tema claro / oscuro
   -------------------------------------------------------------------------- */
function applyTheme(theme) {
  const btn = document.getElementById('btn-theme');
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('javalearn_dam_theme', theme); } catch (e) { /* sin storage */ }
  const tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', theme === 'dark' ? '#181825' : '#eff1f5');
  if (btn) {
    /* El icono muestra el tema al que se cambiará */
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? t('theme_to_light') : t('theme_to_dark'));
  }
}

function initTheme() {
  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }
  /* Sincroniza icono/aria con el tema ya aplicado por el script del <head> */
  const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  if (btn) {
    btn.textContent = cur === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', cur === 'dark' ? t('theme_to_light') : t('theme_to_dark'));
  }
  document.addEventListener('languagechange', () => {
    const c = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    if (btn) btn.setAttribute('aria-label', c === 'dark' ? t('theme_to_light') : t('theme_to_dark'));
  });
}

/* --------------------------------------------------------------------------
   Inicialización
   -------------------------------------------------------------------------- */
function initApp() {
  loadProgress();

  initBlocks();
  initParsons();
  initEditor();
  initHome();

  const btnEs = document.getElementById('btn-lang-es');
  if (btnEs) btnEs.addEventListener('click', () => setLanguage('es'));
  const btnVa = document.getElementById('btn-lang-va');
  if (btnVa) btnVa.addEventListener('click', () => setLanguage('va'));

  MODES.forEach((m) => {
    const btn = document.getElementById(`btn-mode-${m}`);
    if (btn) btn.addEventListener('click', () => switchMode(m));
  });

  initTheme();

  setLanguage('es');

  /* Intro: la landing solo aparece en la primera visita (o si no hay storage) */
  let seen = false;
  try { seen = localStorage.getItem('javalearn_dam_seen') === '1'; } catch (e) { seen = false; }
  switchMode(seen ? 'blocks' : 'home');

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
