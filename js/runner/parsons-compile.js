/* ==========================================================================
   parsons-compile — compila con el motor real la solución Parsons montada
   por el alumnado en la columna derecha (#parsons-target).
   El resultado se pinta en #parsons-feedback (se le quita la clase 'hidden').
   ========================================================================== */

import { t } from '../i18n.js';
import { escapeHtml } from '../utils.js';
import { markCompleted } from '../state.js';
import { JAVA_PRELUDE } from '../../data/java-support.js';
import {
  isEngineSupported,
  runJava,
  classifyResult
} from './java-engine.js';

/* Estilos de las cajas de feedback (mismos patrones que el monolito). */
const FB_OK = 'p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-300';
const FB_ERR = 'p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-mono text-rose-300';
const FB_WARN = 'p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-300';

/* Recorta un texto a un máximo de líneas. */
function clipLines(text, maxLines) {
  const lines = String(text == null ? '' : text).split('\n');
  if (lines.length <= maxLines) return lines.join('\n');
  return lines.slice(0, maxLines).join('\n') + '\n…';
}

/* --------------------------------------------------------------------------
   Ensambla Main con las líneas de la columna derecha dentro de main,
   compila con el motor real y pinta el resultado en fbEl.
   Devuelve SIEMPRE.
   -------------------------------------------------------------------------- */
export async function compileParsonsSolution(act, lines, fbEl) {
  if (!fbEl) return;
  fbEl.classList.remove('hidden');

  const items = Array.isArray(lines) ? lines : [];
  if (!items.length) {
    fbEl.className = FB_ERR;
    fbEl.textContent = t('par_need_lines');
    return;
  }

  if (!isEngineSupported()) {
    fbEl.className = FB_WARN;
    fbEl.textContent = t('engine_fallback');
    return;
  }

  // Fuente: preludio + Main con las líneas del puzzle (8 + 2 por nivel).
  const body = items
    .map(l => '        ' + '  '.repeat(l.indent || 0) + l.text)
    .join('\n');
  const source = JAVA_PRELUDE +
    'public class Main {\n' +
    '    public static void main(String[] args) {\n' +
    body + '\n' +
    '    }\n' +
    '}';

  let res;
  try {
    res = await runJava(source);
  } catch (err) {
    if (err && err.code === 'ENGINE_TIMEOUT') {
      fbEl.className = FB_WARN;
      fbEl.textContent = t('engine_timeout');
      return;
    }
    // ENGINE_UNAVAILABLE (o cualquier otro fallo de carga/red).
    fbEl.className = FB_WARN;
    fbEl.textContent = t('engine_fallback');
    return;
  }

  const c = classifyResult(res);

  if (c.status === 'ok') {
    fbEl.className = FB_OK;
    fbEl.textContent = t('par_ok');
    if (act) markCompleted('parsons', act.id);
    return;
  }

  fbEl.className = FB_ERR;
  fbEl.innerHTML = escapeHtml('❌ ' + clipLines(c.detail, 15));
}
