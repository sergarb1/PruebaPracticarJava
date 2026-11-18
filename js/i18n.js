/* ==========================================================================
   i18n — gestor de idioma (ES / VA)
   - Dict en data/i18n-dict.js
   - setLanguage() actualiza todos los elementos con [data-i18n] y despacha
     el evento document 'languagechange' para que los módulos se re-rendericen.
   ========================================================================== */
import { I18N } from '../data/i18n-dict.js';

export { I18N };

export let currentLang = 'es';

export const isEs = () => currentLang === 'es';

/** Traducción por clave (con fallback a ES y, si no existe, a la propia clave). */
export function t(key) {
  const dict = I18N[currentLang] || I18N.es;
  if (dict[key] != null) return dict[key];
  if (I18N.es[key] != null) return I18N.es[key];
  return key;
}

/** Reemplaza tokens {nombre} de una clave traducida. */
export function tf(key, vars) {
  let s = t(key);
  for (const k of Object.keys(vars || {})) {
    s = s.split(`{${k}}`).join(String(vars[k]));
  }
  return s;
}

/**
 * Cambia el idioma:
 * 1) pinta los botones ES/VA,
 * 2) actualiza todos los [data-i18n] del DOM,
 * 3) despacha 'languagechange' (los módulos se re-renderizan solos).
 */
export function setLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;

  const clsOn = 'px-2.5 py-1 rounded bg-amber-500 text-slate-900 shadow';
  const clsOff = 'px-2.5 py-1 rounded text-ide-muted hover:text-ide-heading';
  const bEs = document.getElementById('btn-lang-es');
  const bVa = document.getElementById('btn-lang-va');
  if (bEs) bEs.className = lang === 'es' ? clsOn : clsOff;
  if (bVa) bVa.className = lang === 'va' ? clsOn : clsOff;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = (I18N[lang] || {})[key];
    if (val != null) el.textContent = val;
  });

  /* Atributos aria traducidos (p. ej. aria-label de los <select>) */
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const val = (I18N[lang] || {})[key] != null ? I18N[lang][key] : I18N.es[key];
    if (val != null) el.setAttribute('aria-label', val);
  });

  document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
}
