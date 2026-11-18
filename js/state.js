/* ==========================================================================
   state — progreso del alumnado en localStorage + barra global
   Clave de almacenamiento idéntica al original: 'javalearn_dam_prog'
   Eventos:
     - 'progresschange' (document): se despacha al marcar una actividad como
       completada, para que los <select> se refresquen con el ✔.
   ========================================================================== */

const STORAGE_KEY = 'javalearn_dam_prog';

export const progress = {
  blocks: {},
  parsons: {},
  editor: {}
};

export function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      progress.blocks = parsed.blocks || {};
      progress.parsons = parsed.parsons || {};
      progress.editor = parsed.editor || {};
    }
  } catch (e) {
    console.warn('LocalStorage inaccesible', e);
  }
  updateGlobalProgress();
}

export function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) { /* almacenamiento no disponible */ }
  updateGlobalProgress();
}

export function updateGlobalProgress() {
  const bCount = Object.keys(progress.blocks || {}).length;
  const pCount = Object.keys(progress.parsons || {}).length;
  const eCount = Object.keys(progress.editor || {}).length;
  const total = bCount + pCount + eCount;
  const statTotal = document.getElementById('stat-total');
  const statBar = document.getElementById('stat-bar');
  if (statTotal) statTotal.textContent = `${total}/450`;
  if (statBar) statBar.style.width = `${Math.min(100, Math.round((total / 450) * 100))}%`;
}

/** Marca una actividad como superada, persiste y notifica a los módulos. */
export function markCompleted(section, id) {
  if (!progress[section]) progress[section] = {};
  progress[section][id] = true;
  saveProgress();
  document.dispatchEvent(new CustomEvent('progresschange', { detail: { section, id } }));
}
