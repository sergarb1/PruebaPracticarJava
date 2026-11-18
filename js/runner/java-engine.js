/* ==========================================================================
   java-engine — motor Java real (WASM) cargado desde CDN
   - Carga perezosa del bundle IIFE (define el global `JavaWasm`) la 1ª vez.
   - Runtime persistente durante la sesión (caché a nivel de módulo).
   - Timeout de 20.000 ms por ejecución -> Error .code = 'ENGINE_TIMEOUT'
     (y se reinicia el motor para matar el Worker colgado).
   - Fallo de carga/red -> Error .code = 'ENGINE_UNAVAILABLE'.
   ========================================================================== */

import { t, tf } from '../i18n.js';

/* CDN fijo del paquete (sin fetch: se inyecta como <script>). */
const ENGINE_CDN = 'https://unpkg.com/@live-codes/java-wasm@0.1.0/dist/java-wasm.iife.js';

/* Límite por ejecución en milisegundos. */
const RUN_TIMEOUT_MS = 20000;

/* Caché de módulo: runtime creado y promesa de creación en curso. */
let runtimeInstance = null;
let runtimePromise = null;

/* --------------------------------------------------------------------------
   ¿Se puede usar el motor en este contexto?
   -------------------------------------------------------------------------- */
export function isEngineSupported() {
  if (typeof location !== 'undefined' && location.protocol === 'file:') return false;
  return typeof Worker !== 'undefined';
}

/* --------------------------------------------------------------------------
   Carga del bundle: añade un <script> a <head> y espera a load/error.
   -------------------------------------------------------------------------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('No se pudo cargar el bundle del motor Java'));
    document.head.appendChild(s);
  });
}

/* --------------------------------------------------------------------------
   Banner de estado (#engine-status / #engine-status-text).
   Si los elementos no existen, no hace nada (no-op).
   -------------------------------------------------------------------------- */
export function setEngineStatus(msg, kind = 'loading') {
  const el = document.getElementById('engine-status');
  const span = document.getElementById('engine-status-text');
  if (!el || !span) return;

  if (msg == null) {
    el.classList.add('hidden');
    span.textContent = '';
    return;
  }

  el.classList.remove('hidden');
  span.textContent = String(msg);
  span.classList.remove('animate-pulse', 'text-ide-warning', 'text-ide-danger');
  if (kind === 'loading') span.classList.add('animate-pulse', 'text-ide-warning');
  else if (kind === 'fallback') span.classList.add('text-ide-warning');
  else if (kind === 'error') span.classList.add('text-ide-danger');
}

/* --------------------------------------------------------------------------
   Progreso del motor: etapas 'init' | 'compile' | 'generate' | 'run'.
   En 'init' se pinta el banner; al terminar createRuntime se oculta.
   -------------------------------------------------------------------------- */
function handleProgress(evt, userCb) {
  try {
    if (evt && evt.stage === 'init') {
      setEngineStatus(tf('engine_stage', { stage: evt.stage }), 'loading');
    }
  } catch (e) { /* el banner es best-effort: nunca rompe la ejecución */ }

  if (typeof userCb === 'function') {
    try { userCb(evt); } catch (e) { /* callback del llamante */ }
  }
}

/* --------------------------------------------------------------------------
   Runtime perezoso + cacheado. Si la carga o createRuntime fallan,
   se lanza un Error con .code = 'ENGINE_UNAVAILABLE' (y se limpia la
   promesa para poder reintentar en la próxima llamada).
   -------------------------------------------------------------------------- */
function getRuntime(onProgress) {
  if (runtimeInstance) return Promise.resolve(runtimeInstance);

  if (!runtimePromise) {
    runtimePromise = (async () => {
      try {
        if (typeof JavaWasm === 'undefined') await loadScript(ENGINE_CDN);
        const rt = await JavaWasm.createRuntime({
          onProgress: (evt) => handleProgress(evt, onProgress)
        });
        runtimeInstance = rt;
        setEngineStatus(null); // banner 'init' fuera: runtime listo
        return rt;
      } catch (err) {
        runtimePromise = null; // permite reintentar más adelante
        const e = err instanceof Error ? err : new Error(String(err));
        e.code = 'ENGINE_UNAVAILABLE';
        if (!e.message) e.message = t('engine_fallback');
        throw e;
      }
    })();
  }
  return runtimePromise;
}

/* --------------------------------------------------------------------------
   Ejecuta Java con timeout de 20 s.
   -------------------------------------------------------------------------- */
export async function runJava(source, opts = {}, onProgress) {
  const rt = await getRuntime(onProgress);

  let timerId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const err = new Error(t('engine_timeout'));
      err.code = 'ENGINE_TIMEOUT';
      reject(err);
    }, RUN_TIMEOUT_MS);
  });

  try {
    // El paquete devuelve { ok, output, error, exitCode, stdout, stderr,
    // compileMs, generateMs, runMs }: se devuelve tal cual.
    return await Promise.race([rt.run(source, opts), timeoutPromise]);
  } catch (err) {
    if (err && err.code === 'ENGINE_TIMEOUT') {
      resetEngine(); // Worker colgado (¿bucle infinito?): destruir y recargar
      throw err;
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

/* --------------------------------------------------------------------------
   Reinicia el motor: destruye el runtime y limpia la caché de módulo.
   -------------------------------------------------------------------------- */
export function resetEngine() {
  if (runtimeInstance) {
    try { runtimeInstance.destroy(); } catch (e) { /* ya destruido */ }
  }
  runtimeInstance = null;
  runtimePromise = null;
  setEngineStatus(null); // limpia el banner del motor tras el reinicio
}

/* --------------------------------------------------------------------------
   Clasifica el resultado del paquete para que la UI pinte una u otra caja.
   -------------------------------------------------------------------------- */
export function classifyResult(res) {
  const r = res || {};
  const stderr = String(r.stderr || '').trim();
  const error = String(r.error || '').trim();
  // El paquete a veces repite el mismo texto en stderr y error: no duplicar.
  let combined = '';
  if (stderr && error) {
    combined = stderr.includes(error) ? stderr : (error.includes(stderr) ? error : stderr + '\n' + error);
  } else {
    combined = stderr || error;
  }
  combined = combined.trim();
  const exitInfo = 'exitCode ' + (r.exitCode == null ? 0 : r.exitCode);

  // javac diagnostica errores como "Main.java:12: error: ..." o directamente
  // "Main.java:1: class X is public, ..." (chequeo de nombre de fichero).
  // Los frames de stack trace ("Main.java:5)") no llevan ':' tras los dígitos.
  if (/\.java:\d+:/.test(combined)) {
    return { status: 'compile-error', detail: combined || exitInfo };
  }
  if (!r.ok || (r.exitCode && r.exitCode !== 0)) {
    return { status: 'runtime-error', detail: combined || exitInfo };
  }
  return { status: 'ok', detail: '' };
}
