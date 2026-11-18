/* ==========================================================================
   utils — utilidades compartidas (escape HTML, etiquetas de nivel)
   ========================================================================== */
import { isEs } from './i18n.js';

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getLevelLabel(level) {
  if (level === 'easy') return isEs() ? 'FÁCIL' : 'FÀCIL';
  if (level === 'medium') return isEs() ? 'MEDIO' : 'MITJÀ';
  return isEs() ? 'AVANZADO' : 'AVANÇAT';
}

export function getBadgeClass(level) {
  if (level === 'easy') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (level === 'medium') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
}
