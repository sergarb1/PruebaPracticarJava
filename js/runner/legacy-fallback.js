/* ==========================================================================
   legacy-fallback — puerto casi literal del simulador del monolito
   (legacy/AplicacionJAVA-original.html). Se usa cuando el motor WASM no
   está disponible (file://, sin Worker o sin red): mismos mensajes y mismo
   HTML que el simulador antiguo, pero el éxito se notifica con
   markCompleted(...) (el listener de 'progresschange' repuebla los selects).
   ========================================================================== */

import { currentLang } from '../i18n.js';
import { escapeHtml } from '../utils.js';
import { markCompleted } from '../state.js';

/* --------------------------------------------------------------------------
   Extrae los parámetros y el cuerpo (convertido a JS elemental) de un
   método Java escrito por el alumnado. Textos de error idénticos al original.
   -------------------------------------------------------------------------- */
export function extractMethodBodyAndParams(code, funcName) {
  // Intenta extraer los nombres de los parámetros del método Java escrito
  const regexHeader = new RegExp(`(?:public|static|final|private|protected|\\s)*[\\w<>\\[\\]]+\\s+${funcName}\\s*\\(([^)]*)\\)\\s*\\{`, 'm');
  const matchH = code.match(regexHeader);

  let paramNames = [];
  let bodyStartIndex = -1;

  if (matchH) {
    const rawParams = matchH[1].trim();
    if (rawParams) {
      paramNames = rawParams.split(',').map(p => {
        const parts = p.trim().split(/\s+/);
        return parts[parts.length - 1].replace(/[^\w$]/g, '');
      });
    }
    bodyStartIndex = matchH.index + matchH[0].length;
  } else {
    // Si el alumno eliminó la firma o cambió el nombre, busca la primera llave abierta
    bodyStartIndex = code.indexOf('{');
    if (bodyStartIndex !== -1) bodyStartIndex++;
  }

  if (bodyStartIndex === -1) {
    throw new Error(currentLang === 'es' ? 'No se encontró la apertura de llaves { del método.' : 'No s\'ha trobat l\'obertura de claus { del mètode.');
  }

  // Extraer bloque equilibrado de llaves
  let depth = 1;
  let bodyEndIndex = -1;
  for (let i = bodyStartIndex; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) {
        bodyEndIndex = i;
        break;
      }
    }
  }

  if (bodyEndIndex === -1) {
    throw new Error(currentLang === 'es' ? 'Falta cerrar la llave } del método.' : 'Falta tancar la clau } del mètode.');
  }

  const rawBody = code.substring(bodyStartIndex, bodyEndIndex);

  // Conversión sintáctica elemental de Java a JavaScript para el runner en el navegador:
  const jsBody = rawBody
    // tipos primitivos y declaraciones
    .replace(/\b(int|double|float|long|short|byte|boolean|String|char)\s+([a-zA-Z_$][\w$]*)\b/g, 'let $2')
    .replace(/\b(int|double|float|String|char|boolean)\[\]\s+([a-zA-Z_$][\w$]*)\b/g, 'let $2')
    .replace(/\b(int|double|float|String|char|boolean)\[\]\[\]\s+([a-zA-Z_$][\w$]*)\b/g, 'let $2')
    // String methods
    .replace(/\.length\(\)/g, '.length')
    .replace(/\.charAt\(([^)]+)\)/g, '[$1]')
    .replace(/\.equals\(([^)]+)\)/g, ' === $1')
    .replace(/\.equalsIgnoreCase\(([^)]+)\)/g, '.toLowerCase() === ($1).toLowerCase()')
    // Math helpers
    .replace(/Math\.abs\(/g, 'Math.abs(')
    .replace(/Character\.isUpperCase\(([^)]+)\)/g, '(/[A-Z]/.test($1))')
    .replace(/Character\.isDigit\(([^)]+)\)/g, '(/[0-9]/.test($1))')
    // System.out
    .replace(/System\.out\.println\([^)]*\);?/g, '');

  return { paramNames, jsBody };
}

/* --------------------------------------------------------------------------
   Simulador de la actividad de bloques (runBlockSimulation original).
   Sustituye progress.blocks[...] + saveProgress() + populateBlockSelect()
   por markCompleted('blocks', act.id).
   -------------------------------------------------------------------------- */
export function runLegacyBlocks(act, workspaceItems, termEl) {
  const term = termEl || document.getElementById('blocks-terminal');
  if (!act || !term) return;

  term.innerHTML = `<span class="text-ide-accent">&gt; [JVM] Compilando Main.java (${escapeHtml(act.funcName)})...</span>\n`;

  const items = Array.isArray(workspaceItems) ? workspaceItems : [];
  const outputLines = [];
  items.forEach(b => {
    if (!b || typeof b.code !== 'string') return;
    const m = b.code.match(/System\.out\.print(ln)?\((.*)\);/);
    if (m) {
      outputLines.push(act.expected);
    }
  });

  const actual = outputLines.join('\n').trim();
  setTimeout(() => {
    if (!actual) {
      term.innerHTML += `<span class="text-amber-400">&gt; Programa ejecutado sin salida estándar. Incluye una sentencia System.out.println(...).</span>\n`;
      return;
    }

    term.innerHTML += `<span class="text-white">&gt; Salida:\n${escapeHtml(actual)}</span>\n\n`;
    if (actual === act.expected.trim()) {
      term.innerHTML += `<span class="text-emerald-400 font-bold">&gt; ✔ ¡ACTIVIDAD COMPLETADA CON ÉXITO!</span>`;
      markCompleted('blocks', act.id);
    } else {
      term.innerHTML += `<span class="text-rose-400">&gt; ❌ La salida obtenida no coincide con la esperada ('${escapeHtml(act.expected)}').</span>`;
    }
  }, 150);
}

/* --------------------------------------------------------------------------
   Suite de tests en JavaScript (runEditorJUnitTests original): extrae el
   cuerpo del método del alumnado, lo evalúa con new Function y pinta los
   mismos bloques HTML por test + el badge de resumen.
   -------------------------------------------------------------------------- */
export function runLegacyEditorTests(act, userCode, termEl) {
  const term = termEl || document.getElementById('junit-terminal');
  const code = String(userCode || '');
  if (!act || !term) return;

  term.innerHTML = `<div class="text-ide-accent font-semibold pb-1 border-b border-ide-border">&gt; Ejecutando suite de pruebas JUnit para ${escapeHtml(act.funcName)}...</div>`;

  let parsed = null;
  try {
    parsed = extractMethodBodyAndParams(code, act.funcName);
  } catch (err) {
    term.innerHTML += `<div class="p-2 mt-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">❌ Error de compilación sintáctica: ${escapeHtml(err.message)}</div>`;
    return;
  }

  let userFn = null;
  try {
    userFn = new Function(...parsed.paramNames, parsed.jsBody);
  } catch (compileErr) {
    term.innerHTML += `<div class="p-2 mt-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">❌ Error al evaluar el código: ${escapeHtml(compileErr.message)}</div>`;
    return;
  }

  let passedCount = 0;
  let htmlResults = '';

  act.tests.forEach((tc, idx) => {
    let isPass = false;
    let actual = null;
    let errorMsg = null;

    try {
      actual = userFn(...tc.args);

      // Normalización para comparaciones
      if (typeof tc.exp === 'number' && typeof actual === 'number') {
        isPass = Math.abs(actual - tc.exp) < 0.001;
      } else if (typeof tc.exp === 'boolean') {
        isPass = actual === tc.exp;
      } else if (Array.isArray(tc.exp)) {
        isPass = JSON.stringify(actual) === JSON.stringify(tc.exp);
      } else {
        isPass = String(actual) === String(tc.exp);
      }

      if (isPass) passedCount++;
    } catch (execErr) {
      errorMsg = execErr.message;
    }

    if (isPass) {
      htmlResults += `
            <div class="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <span class="font-bold">✔ TEST ${idx + 1} PASADO:</span> ${escapeHtml(tc.call)} == ${escapeHtml(JSON.stringify(tc.exp))}
            </div>
          `;
    } else {
      htmlResults += `
            <div class="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <span class="font-bold">❌ TEST ${idx + 1} FALLADO:</span> ${escapeHtml(tc.call)}<br>
              <span class="text-[11px] text-ide-muted">Esperado: <strong>${escapeHtml(JSON.stringify(tc.exp))}</strong> | Obtenido: <strong>${errorMsg ? 'Excepción: ' + escapeHtml(errorMsg) : escapeHtml(JSON.stringify(actual))}</strong></span>
            </div>
          `;
    }
  });

  term.innerHTML += htmlResults;

  const badge = document.getElementById('test-summary-badge');
  if (badge) {
    badge.textContent = `${passedCount}/${act.tests.length} ${currentLang === 'es' ? 'pasados' : 'passats'}`;
    badge.className = passedCount === act.tests.length
      ? 'text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold'
      : 'text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold';
  }

  if (passedCount === act.tests.length) {
    term.innerHTML += `<div class="text-emerald-400 font-bold pt-2 border-t border-ide-border">&gt; ¡ENHORABUENA! Todos los casos de prueba han superado la verificación.</div>`;
    markCompleted('editor', act.id);
  }
}
