# JavaLearn DAM — Contrato de módulos (INTERFACES)

Aplicación **sin build**: módulos ES natos (`<script type="module">`), Tailwind por CDN.
Entrada: `index.html`. Servida por HTTP (GitHub Pages / Live Server). El monolito
original está en `legacy/AplicacionJAVA-original.html` SOLO como referencia.

## Ficheros y responsables

```
data/i18n-dict.js      (extraído, NO tocar salvo añadir claves)
data/topics.js         (extraído)
data/editor-methods.js (extraído)
data/activities.js     (extraído)  → export BLOCK_ACTIVITIES, PARSONS_ACTIVITIES, EDITOR_ACTIVITIES
data/java-support.js   → export JAVA_PRELUDE (String)
js/i18n.js   → export I18N, currentLang, isEs(), t(key), tf(key, vars), setLanguage(lang)
js/state.js  → export progress{blocks,parsons,editor}, loadProgress(), saveProgress(),
               updateGlobalProgress(), markCompleted(section, id)
js/utils.js  → export escapeHtml(str), getLevelLabel(level), getBadgeClass(level)
js/runner/*            (Agent RUNNERS)
js/blocks.js, js/parsons.js, js/editor.js, js/app.js  (Agent UI)
index.html, css/theme.css, sw.js  (Agent HTML)
tools/audit.html       (Agent AUDIT)
```

## Eventos globales (document)

- `'languagechange'`: despachado por `setLanguage()`. **Cada módulo de UI** registra su
  propio listener y re-renderiza lo suyo (selects con ✔, títulos, badges, placeholders).
- `'progresschange'`: despachado por `markCompleted(section,id)`. Los módulos con <select>
  re-pueblan su select para refrescar el ✔.

## js/runner/java-engine.js (Agent RUNNERS)

```js
export function isEngineSupported(): boolean
  // false si location.protocol === 'file:' o falta Worker
export async function runJava(source, opts = {}, onProgress?) : Promise<EngineResult>
  // carga perezosa del bundle CDN la primera vez; runtime persistente en sesión;
  // timeout 20s -> lanza Error con .code = 'ENGINE_TIMEOUT' (y resetea el motor)
  // fallo de carga/red -> Error con .code = 'ENGINE_UNAVAILABLE'
  // onProgress({stage, detail}) con stages 'init'|'compile'|'generate'|'run'
  //   (en stage init/muestra banner vía setEngineStatus)
export function resetEngine(): void   // destruye runtime y fuerza recarga futura
export function classifyResult(res): { status: 'ok'|'compile-error'|'runtime-error', detail: string }
  // compile-error si stderr contiene /\.java:\d+:\s*error:/
  // runtime-error si !res.ok || exitCode !== 0
export function setEngineStatus(msg|null, kind?: 'loading'|'fallback'|'error'): void
  // manipulate #engine-status (classList hidden) y #engine-status-text (textContent)
```

`EngineResult` = objeto del paquete: `{ ok, output, error, exitCode, stdout, stderr, compileMs, generateMs, runMs }`.

CDN fijo: `https://unpkg.com/@live-codes/java-wasm@0.1.0/dist/java-wasm.iife.js` (global `JavaWasm`).

## Runner API usada por la UI

```js
// js/runner/blocks-runner.js
export function buildMainSource(workspaceItems): string
  // fuente COMPLETA "public class Main {...}" sin preludio (para el visor del panel)
export async function runBlockProgram(act, workspaceItems, termEl): Promise<void>
  // renderiza en termEl; éxito -> markCompleted('blocks', act.id)
  // sin motor -> runLegacyBlocks() y banner fallback

// js/runner/junit-runner.js
export function buildTestDriver(act, userCode): string
  // fuente Java completa: clase pública Main con driver de tests + código del alumno.
  // Usado también por tools/audit.html. Clase detectada con /class\s+([A-Za-z_$][\w$]*)/
  // del userCode (default 'Solucion').
export async function runEditorJUnit(act, userCode, termEl): Promise<void>
  // compila+ejecuta, pinta resultados en termEl, actualiza #test-summary-badge,
  // éxito total -> markCompleted('editor', act.id)
  // sin motor -> runLegacyEditorTests()

// js/runner/parsons-compile.js
export async function compileParsonsSolution(act, lines, fbEl): Promise<void>
  // lines: [{text, indent}] de #parsons-target; ensambla Main con esas líneas dentro
  // de main, compila con el motor y pinta el resultado en fbEl (#parsons-feedback,
  // quitarle la clase 'hidden'). Sin líneas -> mensaje par_need_lines.
  // Sin motor -> mensaje engine_fallback.

// js/runner/legacy-fallback.js  (puerto literal del monolito)
export function runLegacyBlocks(act, workspaceItems, termEl): void
export function runLegacyEditorTests(act, userCode, termEl): void
export function extractMethodBodyAndParams(code, funcName): { paramNames, jsBody }
```

Ambos legacy usan `markCompleted(...)` en éxito (NO tocan progress a mano ni repueblan
selects: eso lo hace el listener de 'progresschange').

## Formato de salida del driver de tests (junit-runner)

Por cada test la clase Main imprime UNA línea:
`TEST|<n>|PASS`  ·  `TEST|<n>|FAIL|<esperado>|<obtenido>`  ·  `TEST|<n>|ERROR|<msg>`
(valores saneados: `|`→`/`, saltos de línea→espacio). El resto de stdout del programa
se muestra aparte como "Salida del programa". Líneas `NN: error:` de javac → bloque
rojo "Error de compilación" (mostrar stderr tal cual, hasta ~15 líneas).

Comparación en Java: si ambos son `Number` → `Math.abs(diff) < 1e-6`; si no →
`String.valueOf(actual).equals(String.valueOf(expected))`.

## Claves i18n añadidas (ya en data/i18n-dict.js)

`par_compile, par_compiling, par_need_lines, par_ok, blk_compiling, blk_no_output,
blk_success, blk_fail({expected}), engine_loading, engine_stage({stage}),
engine_fallback, engine_timeout, junit_compiling`

Uso: `t('blk_success')` o `tf('blk_fail', { expected: act.expected })`.

## IDs obligatorios del DOM (index.html)

Header: `btn-lang-es`, `btn-lang-va`, `btn-mode-blocks|parsons|editor`,
`lbl-author-badge`, `lbl-subtitle`, `lbl-progress-title`, `stat-total`, `stat-bar`,
`lbl-footer-author`.
Banner motor: `engine-status` (div, arranca con clase `hidden`), `engine-status-text` (span).
Bloques: `panel-blocks`, `select-block-act`, `flt-blk-all|easy|medium|hard`, `lbl-flt-blk`,
`lbl-blk-select`, `blk-level-badge`, `blk-act-title`, `blk-act-desc`, `lbl-blk-target`,
`blk-target-output`, `lbl-palette`, `lbl-click-add`, `palette-container`, `lbl-workspace`,
`blk-counter`, `btn-ws-clear` (button; span interno data-i18n="clear_blk"),
`btn-copy-code` (button, data-i18n="copy_code"), `btn-run-blocks` (button; span interno
data-i18n="run_blk"), `blocks-java-code`, `blocks-terminal`.
Parsons: `panel-parsons`, `select-parsons-act`, `flt-par-all|easy|medium|hard`,
`lbl-flt-par`, `lbl-par-select`, `par-level-badge`, `par-act-title`, `par-act-desc`,
`btn-par-reset` (span data-i18n="reset_par"), `btn-par-check` (span data-i18n="check_par"),
`btn-par-compile` (span data-i18n="par_compile"), `lbl-par-bank`, `lbl-par-hint`,
`lbl-par-target`, `lbl-par-indent-info`, `parsons-bank`, `parsons-target`, `parsons-feedback`.
Editor: `panel-editor`, `select-editor-act`, `flt-edt-all|easy|medium|hard`, `lbl-flt-edt`,
`lbl-edt-select`, `edt-level-badge`, `edt-act-title`, `edt-act-desc`,
`btn-edt-clear` (span data-i18n="clear_manual"), `btn-edt-solution` (span data-i18n="show_solution"),
`btn-edt-restore` (span data-i18n="restore_tpl"), `btn-edt-run` (span data-i18n="run_tests"),
`java-code-editor`, `lbl-editor-tip`, `test-summary-badge`, `junit-terminal`.
Modal: `solution-modal`, `btn-modal-x`, `modal-method-badge`, `lbl-modal-title`,
`lbl-modal-subtitle`, `lbl-modal-user-code`, `modal-user-preview`, `modal-user-status`,
`lbl-modal-official-code`, `modal-official-preview`, `btn-copy-solution` (button, data-i18n="btn_copy_solution"),
`lbl-modal-tip`, `btn-modal-apply` (span data-i18n="btn_apply_solution"),
`btn-modal-close` (span data-i18n="btn_close_modal").

**Cero `onclick`/`onchange` inline**: todos los listeners se registran en JS
(`initBlocks()`, `initParsons()`, `initEditor()`, `initApp()`).

`data-i18n` obligatorio en todos los textos traducibles (el `setLanguage` genérico los
pinta; mapeo clave→elemento en la lista anterior: p.ej. `lbl-flt-blk`→`flt_level`,
`flt-blk-all`→`btn_all`, `lbl-nav-blocks`→`nav_blocks`... el resto de claves ya existen
en el dict: author_badge, footer_author, subtitle, nav_*, progress_title, blk_select,
par_select, edt_select, target_output, palette, click_add, workspace, clear_blk,
copy_code, run_blk, par_bank, par_hint, par_target, par_indent_info, reset_par,
check_par, clear_manual, show_solution, restore_tpl, run_tests, editor_tip, modal_*).

## Estética (mantener el look del original)

Paleta Tailwind `ide.*` (bg #181825, surface #1e1e2e, card #252538, border #313244,
accent #89b4fa, success #a6e3a1, warning #f9e2af, danger #f38ba8, text #cdd6f4,
muted #9399b2) + amber como color de marca. Fuentes Inter + Fira Code por Google Fonts.
Mensajes de terminal: éxito `text-emerald-400 font-bold`, error `text-rose-400`,
informativo `text-ide-accent`, output `text-white`. Cajas de resultado de tests:
`p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300` (o rose).
