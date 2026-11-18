/* ==========================================================================
   blocks-runner — ejecución de la actividad de bloques
   - buildMainSource(): fuente COMPLETA "public class Main {...}" SIN preludio
     (la usa el visor del panel; el preludio solo se añade al compilar).
   - runBlockProgram(): compila con el motor WASM real y pinta la terminal.
     Sin motor / timeout / error de carga -> simulador legacy.
   ========================================================================== */

import { t, tf, isEs } from '../i18n.js';
import { escapeHtml } from '../utils.js';
import { markCompleted } from '../state.js';
import { JAVA_PRELUDE } from '../../data/java-support.js';
import {
  isEngineSupported,
  runJava,
  classifyResult,
  setEngineStatus
} from './java-engine.js';
import { runLegacyBlocks } from './legacy-fallback.js';

/* Recorta un texto a un máximo de líneas (para las cajas de error). */
function clipLines(text, maxLines) {
  const lines = String(text == null ? '' : text).split('\n');
  if (lines.length <= maxLines) return lines.join('\n');
  return lines.slice(0, maxLines).join('\n') + '\n…';
}

/* --------------------------------------------------------------------------
   Genera la fuente completa de Main a partir del workspace del alumnado.
   -------------------------------------------------------------------------- */
export function buildMainSource(workspaceItems) {
  const items = Array.isArray(workspaceItems) ? workspaceItems : [];
  let codeLines = items
    .filter(b => b && typeof b.code === 'string')
    .map(b => '        ' + b.code)
    .join('\n');

  if (!codeLines) {
    codeLines = '        // ' + (isEs()
      ? 'Añade bloques para generar código...'
      : 'Afig blocs per a generar codi...');
  }

  return 'public class Main {\n' +
         '    public static void main(String[] args) {\n' +
         codeLines + '\n' +
         '    }\n' +
         '}';
}

/* --------------------------------------------------------------------------
   Compila y ejecuta la actividad de bloques en la terminal indicada.
   Devuelve SIEMPRE (los botones de la UI reactivan su estado al resolver).
   -------------------------------------------------------------------------- */
export async function runBlockProgram(act, workspaceItems, termEl) {
  const term = termEl || document.getElementById('blocks-terminal');
  if (!act || !term) return;

  term.innerHTML = `<span class="text-ide-accent">${escapeHtml(t('blk_compiling'))}</span>\n`;

  // Sin motor (file:// o sin Worker): simulador legacy + banner de aviso.
  if (!isEngineSupported()) {
    setEngineStatus(t('engine_fallback'), 'fallback');
    runLegacyBlocks(act, workspaceItems, term);
    return;
  }

  // Compilación real: JAVA_PRELUDE (clases de apoyo) + fuente generada.
  let res;
  try {
    res = await runJava(JAVA_PRELUDE + buildMainSource(workspaceItems));
  } catch (err) {
    if (err && err.code === 'ENGINE_TIMEOUT') {
      // El legacy reescribe la terminal con su propia cabecera: el aviso se
      // añade DESPUÉS para que se quede visible.
      runLegacyBlocks(act, workspaceItems, term);
      term.innerHTML += `<span class="text-amber-400">${escapeHtml(t('engine_timeout'))}</span>\n`;
      return;
    }
    // ENGINE_UNAVAILABLE (o cualquier otro fallo de carga/red): legacy.
    setEngineStatus(t('engine_fallback'), 'fallback');
    runLegacyBlocks(act, workspaceItems, term);
    return;
  }

  const c = classifyResult(res);

  if (c.status === 'compile-error') {
    term.innerHTML += `<div class="p-2 mt-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">${escapeHtml(clipLines(c.detail, 15))}</div>`;
    return; // NO se marca como completada
  }

  if (c.status === 'runtime-error') {
    term.innerHTML += `<div class="p-2 mt-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">${escapeHtml(clipLines(c.detail, 15))}</div>`;
    return;
  }

  // Éxito de compilación y ejecución: comparamos la salida real con la esperada.
  const stdout = String(res.stdout || '');
  const expected = String(act.expected == null ? '' : act.expected);

  if (stdout.trim() === '') {
    term.innerHTML += `<span class="text-amber-400">${escapeHtml(t('blk_no_output'))}</span>\n`;
    return;
  }

  term.innerHTML += `<span class="text-white">&gt; Salida:\n${escapeHtml(stdout)}</span>\n\n`;

  if (stdout.trim() === expected.trim()) {
    term.innerHTML += `<span class="text-emerald-400 font-bold">${escapeHtml(t('blk_success'))}</span>`;
    markCompleted('blocks', act.id);
  } else {
    term.innerHTML += `<span class="text-rose-400">${escapeHtml(tf('blk_fail', { expected: expected }))}</span>`;
  }
}
