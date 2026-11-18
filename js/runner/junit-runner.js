/* ==========================================================================
   junit-runner — suite de tests de la actividad de editor (motor real)
   - buildTestDriver(): genera UN único fichero fuente Java con el código del
     alumnado + una clase Main (sin 'public': solo puede haber una clase
     pública por fichero) cuyo main imprime una línea por test:
       TEST|<n>|PASS  ·  TEST|<n>|FAIL|<esperado>|<obtenido>  ·  TEST|<n>|ERROR|<msg>
     (valores saneados: '|' -> '/', saltos de línea -> espacio).
   - Se exporta también buildTestDriver porque lo usa tools/audit.html.
   ========================================================================== */

import { t, tf, isEs } from '../i18n.js';
import { escapeHtml } from '../utils.js';
import { markCompleted } from '../state.js';
import {
  isEngineSupported,
  runJava,
  classifyResult,
  setEngineStatus
} from './java-engine.js';
import { runLegacyEditorTests } from './legacy-fallback.js';

/* Recorta un texto a un máximo de líneas (para las cajas de error). */
function clipLines(text, maxLines) {
  const lines = String(text == null ? '' : text).split('\n');
  if (lines.length <= maxLines) return lines.join('\n');
  return lines.slice(0, maxLines).join('\n') + '\n…';
}

/* --------------------------------------------------------------------------
   Literales JS -> Java:
   - boolean  -> true / false
   - string   -> JSON.stringify (escapes compatibles con Java en nuestros casos)
   - entero   -> String(n)     (se amplía a double en comparación si hace falta)
   - decimal  -> n + 'd'       (p.ej. 4.9d)
   - arrays   -> new int[]{...} / new double[]{...} (o String/boolean/Object)
                 y new int[][]{{1,2},{3,4}} para 2 niveles (los elementos
                 anidados NO llevan prefijo de tipo, solo {...})
   -------------------------------------------------------------------------- */
function componentType(elems) {
  if (elems.every(x => typeof x === 'number' && Number.isInteger(x))) return 'int';
  if (elems.every(x => typeof x === 'number')) return 'double';
  if (elems.every(x => typeof x === 'string')) return 'String';
  if (elems.every(x => typeof x === 'boolean')) return 'boolean';
  return 'Object';
}

function javaArrayLiteral(arr) {
  if (arr.length === 0) return 'new int[0]';

  const nested = arr.every(x => Array.isArray(x));
  if (nested) {
    // 2 niveles: new int[][]{{1,2},{3,4}} — sin tipo dentro de las llaves
    const inner = arr.map(a => '{' + a.map(javaLiteral).join(', ') + '}').join(', ');
    let flat = [];
    arr.forEach(a => { flat = flat.concat(a); });
    return 'new ' + componentType(flat) + '[][]{' + inner + '}';
  }
  return 'new ' + componentType(arr) + '[]{' + arr.map(javaLiteral).join(', ') + '}';
}

function javaLiteral(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v); // entero: 8
    return String(v) + 'd';                    // decimal: 4.9d
  }
  if (Array.isArray(v)) return javaArrayLiteral(v);
  return 'null';
}

/* Saneado de valores impresos: '|' -> '/', saltos de línea -> espacio. */
const SAN_EXPECTED = "String.valueOf(expected).replace('|','/').replace('\\n',' ').replace('\\r',' ')";
const SAN_ACTUAL = "String.valueOf(actual).replace('|','/').replace('\\n',' ').replace('\\r',' ')";
const SAN_MESSAGE = "String.valueOf(ex.getMessage()).replace('|','/').replace('\\n',' ').replace('\\r',' ')";

/* --------------------------------------------------------------------------
   Construye UN String fuente Java completo con el driver de tests.
   -------------------------------------------------------------------------- */
export function buildTestDriver(act, userCode) {
  let code = String(userCode || '');

  // a) detecta la clase del alumnado (por defecto 'Solucion')
  const m = code.match(/class\s+([A-Za-z_$][\w$]*)/);
  let cls = m ? m[1] : 'Solucion';

  // El motor guarda el fuente como Main.java, así que javac rechaza cualquier
  // otra clase pública con nombre distinto ("should be declared in a file
  // named X.java"). Se retira 'public' a la clase del alumno (no cambia el
  // ejercicio) y, si se llama exactamente 'Main', se renombra para no chocar
  // con la clase driver.
  if (cls === 'Main') {
    code = code.replace(/class\s+Main\b/, 'class Solucion');
    cls = 'Solucion';
  } else {
    const safe = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pubRe = new RegExp('\\bpublic(\\s+class\\s+' + safe + '\\b)');
    if (pubRe.test(code)) code = code.replace(pubRe, '$1');
  }

  const tests = (act && Array.isArray(act.tests)) ? act.tests : [];

  // Nombre del método a probar: act.funcName o, en su defecto, el del test.
  let methodName = (act && act.funcName) ? String(act.funcName) : '';
  if (!methodName && tests.length && typeof tests[0].call === 'string') {
    const mc = tests[0].call.match(/^([A-Za-z_$][\w$]*)\s*\(/);
    if (mc) methodName = mc[1];
  }
  if (!methodName) methodName = 'metodo';

  // d) un bloque try/catch POR CADA test dentro de main
  const blocks = tests.map((tc, i) => {
    const n = i + 1;
    const args = Array.isArray(tc.args) ? tc.args : [];
    const call = cls + '.' + methodName + '(' + args.map(javaLiteral).join(', ') + ')';
    const expLit = javaLiteral(tc.exp);

    return [
      '        try {',
      '            Object actual = ' + call + ';',
      '            Object expected = ' + expLit + ';',
      '            boolean pass;',
      '            if (actual instanceof Number && expected instanceof Number) {',
      '                pass = Math.abs(((Number) actual).doubleValue() - ((Number) expected).doubleValue()) < 1e-6;',
      '            } else {',
      '                pass = String.valueOf(actual).equals(String.valueOf(expected));',
      '            }',
      '            System.out.println("TEST|' + n + '|"' + ' + (pass ? "PASS" : "FAIL|" + ' + SAN_EXPECTED + ' + "|" + ' + SAN_ACTUAL + '));',
      '        } catch (Throwable ex) {',
      '            System.out.println("TEST|' + n + '|ERROR|" + ex.getClass().getSimpleName() + ": " + ' + SAN_MESSAGE + ');',
      '        }'
    ].join('\n');
  });

  // b) código del alumnado tal cual + c) clase Main al final (sin 'public')
  let src = code;
  src += '\n\nclass Main {\n';
  src += '    public static void main(String[] args) {\n';
  src += blocks.join('\n');
  src += '\n    }\n';
  src += '}\n';
  return src;
}

/* --------------------------------------------------------------------------
   Parsea SOLO las líneas que empiezan por 'TEST|'.
   -------------------------------------------------------------------------- */
export function parseTestOutput(stdout) {
  const out = [];
  String(stdout == null ? '' : stdout).split(/\r?\n/).forEach(line => {
    if (!line.startsWith('TEST|')) return;
    const parts = line.split('|');
    const n = parseInt(parts[1], 10);
    if (Number.isNaN(n)) return;

    if (parts[2] === 'PASS') {
      out.push({ n, status: 'PASS' });
    } else if (parts[2] === 'FAIL') {
      out.push({ n, status: 'FAIL', expected: parts[3], actual: parts[4] });
    } else if (parts[2] === 'ERROR') {
      out.push({ n, status: 'ERROR', msg: parts.slice(3).join('|') });
    }
  });
  return out;
}

/* --------------------------------------------------------------------------
   Compila y ejecuta la suite en la terminal indicada.
   Devuelve SIEMPRE (los botones de la UI reactivan su estado al resolver).
   -------------------------------------------------------------------------- */
export async function runEditorJUnit(act, userCode, termEl) {
  const term = termEl || document.getElementById('junit-terminal');
  if (!act || !term) return;

  term.innerHTML = `<div class="text-ide-link font-semibold pb-1 border-b border-ide-border">&gt; ${escapeHtml(tf('junit_compiling'))}</div>`;

  // Sin motor (file:// o sin Worker): simulador legacy + banner de aviso.
  if (!isEngineSupported()) {
    setEngineStatus(t('engine_fallback'), 'fallback');
    runLegacyEditorTests(act, userCode, term);
    return;
  }

  let res;
  try {
    res = await runJava(buildTestDriver(act, userCode));
  } catch (err) {
    if (err && err.code === 'ENGINE_TIMEOUT') {
      // El legacy reescribe la terminal con su propia cabecera: el aviso se
      // añade DESPUÉS para que se quede visible.
      runLegacyEditorTests(act, userCode, term);
      term.innerHTML += `<div class="text-ide-warning">${escapeHtml(t('engine_timeout'))}</div>`;
      return;
    }
    // ENGINE_UNAVAILABLE (o cualquier otro fallo de carga/red): legacy.
    setEngineStatus(t('engine_fallback'), 'fallback');
    runLegacyEditorTests(act, userCode, term);
    return;
  }

  const c = classifyResult(res);

  if (c.status === 'compile-error') {
    // El badge se queda como estaba: no tocamos #test-summary-badge.
    const label = isEs() ? 'Error de compilación' : 'Error de compilació';
    term.innerHTML += `<div class="p-2 mt-2 rounded bg-ide-danger/10 border border-ide-danger/20 text-ide-danger"><span class="font-bold">❌ ${escapeHtml(label)}</span>\n${escapeHtml(clipLines(c.detail, 15))}</div>`;
    return;
  }

  if (c.status === 'runtime-error') {
    term.innerHTML += `<div class="p-2 mt-2 rounded bg-ide-danger/10 border border-ide-danger/20 text-ide-danger">${escapeHtml(clipLines(c.detail, 15))}</div>`;
    return;
  }

  // Éxito de compilación: pintamos los resultados test a test.
  const results = parseTestOutput(res.stdout);
  let htmlResults = '';

  results.forEach(r => {
    const tc = (act.tests && act.tests[r.n - 1]) || { call: '', exp: null };

    if (r.status === 'PASS') {
      htmlResults += `
            <div class="p-2 rounded bg-ide-success/10 border border-ide-success/20 text-ide-success">
              <span class="font-bold">✔ TEST ${r.n} PASADO:</span> ${escapeHtml(tc.call)} == ${escapeHtml(JSON.stringify(tc.exp))}
            </div>
          `;
    } else if (r.status === 'FAIL') {
      htmlResults += `
            <div class="p-2 rounded bg-ide-danger/10 border border-ide-danger/20 text-ide-danger">
              <span class="font-bold">❌ TEST ${r.n} FALLADO:</span> ${escapeHtml(tc.call)}<br>
              <span class="text-[11px] text-ide-muted">Esperado: <strong>${escapeHtml(JSON.stringify(tc.exp))}</strong> | Obtenido: <strong>${escapeHtml(r.actual == null ? '' : r.actual)}</strong></span>
            </div>
          `;
    } else {
      htmlResults += `
            <div class="p-2 rounded bg-ide-danger/10 border border-ide-danger/20 text-ide-danger">
              <span class="font-bold">❌ TEST ${r.n} FALLADO:</span> ${escapeHtml(tc.call)}<br>
              <span class="text-[11px] text-ide-muted">Esperado: <strong>${escapeHtml(JSON.stringify(tc.exp))}</strong> | Obtenido: <strong>Excepción: ${escapeHtml(r.msg || '')}</strong></span>
            </div>
          `;
    }
  });

  // El resto de stdout (líneas que no son TEST|) se muestra aparte.
  const otherLines = String(res.stdout || '')
    .split(/\r?\n/)
    .filter(l => l.trim() !== '' && !l.startsWith('TEST|'));

  if (otherLines.length) {
    const label = isEs() ? 'Salida del programa' : 'Eixida del programa';
    htmlResults += `<div class="text-ide-muted">${escapeHtml(label)}:</div>`;
    otherLines.forEach(l => {
      htmlResults += `<div class="text-ide-muted">${escapeHtml(l)}</div>`;
    });
  }

  term.innerHTML += htmlResults;

  // Badge de resumen (mismas clases que el original).
  const passedCount = results.filter(r => r.status === 'PASS').length;
  const total = act.tests.length;
  const badge = document.getElementById('test-summary-badge');
  if (badge) {
    badge.textContent = `${passedCount}/${total} ${isEs() ? 'pasados' : 'passats'}`;
    badge.className = passedCount === total
      ? 'text-[11px] font-mono px-2 py-0.5 rounded bg-ide-success/20 text-ide-success font-bold'
      : 'text-[11px] font-mono px-2 py-0.5 rounded bg-ide-danger/20 text-ide-danger font-bold';
  }

  if (passedCount === total) {
    const finalMsg = isEs()
      ? '¡ENHORABUENA! Todos los casos de prueba han superado la verificación.'
      : '¡ENHORABUENA! Tots els casos de prova han superat la verificació.';
    term.innerHTML += `<div class="text-ide-success font-bold pt-2 border-t border-ide-border">&gt; ${escapeHtml(finalMsg)}</div>`;
    markCompleted('editor', act.id);
  }
}
