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
  if (level === 'easy') return 'bg-ide-success/10 text-ide-success border border-ide-success/20';
  if (level === 'medium') return 'bg-ide-warning/10 text-ide-warning border border-ide-warning/20';
  return 'bg-ide-danger/10 text-ide-danger border border-ide-danger/20';
}
