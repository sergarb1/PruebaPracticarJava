# AGENTS.md — JavaLearn DAM

Plataforma estática para practicar Java (450 retos). **Sin build, sin npm, sin backend.** Sirve GitHub Pages tal cual.

## Comandos

```bash
python3 -m http.server 8080   # → http://localhost:8080/
```

- Los módulos ES y el Worker del motor **no funcionan con `file://`**: siempre servir por HTTP.
- No hay linter/typecheck configurado. Verificación: `tools/audit.html` (300 compilaciones con el motor real; **objetivo 300/300 PASS**), Lighthouse (100/100/100/100) y revisión manual en el navegador.

## Arquitectura

```
index.html            ← entrada única; 3 paneles de ejercicio + panel home (landing)
css/theme.css         ← tipografías, scrollbars, variables de tema (claro/oscuro)
sw.js                 ← Service Worker PWA: caché del shell (precache + SWR),
                         CDN (Tailwind/Fonts) y motor wasm (unpkg)
manifest.webmanifest  ← PWA: name/start_url/icons (standalone)
icons/                ← iconos PNG (192/512/maskable/apple) + SVG fuente
data/
  i18n-dict.js        ← diccionario ES/VA (AÑADIR claves SIEMPRE en ambos idiomas)
  topics.js           ← catálogo de algoritmos (150 Parsons)
  editor-methods.js   ← métodos del micro-editor (150 retos)
  activities.js       ← generadores de las 3×150 actividades
  java-support.js     ← preludio Java (clase Alumno)
js/
  app.js              ← orquestador: switchMode, idioma, tema, intro 1ª vez,
                         instalación PWA (beforeinstallprompt), registro SW
  i18n.js             ← t()/tf()/setLanguage(); actualiza [data-i18n] y despacha 'languagechange'
  state.js            ← progreso en localStorage ('javalearn_dam_prog') + barra x/450
  blocks.js parsons.js editor.js home.js   ← un módulo por panel
  runner/
    java-engine.js    ← motor wasm: runJava / classifyResult / banner de estado
    blocks-runner.js  ← ejecución real de Bloques
    junit-runner.js   ← driver de tests JUnit reales
    parsons-compile.js← «Compilar código» de Parsons
    legacy-fallback.js← simulador legacy (respaldo sin red/file://)
tools/
  audit.html          ← auditoría de compatibilidad (300 compilaciones)
  INTERFACES.md       ← contrato de módulos
legacy/
  AplicacionJAVA-original.html  ← monolito original (referencia, no tocar)
```

## Convenciones

- **Módulos ES nativos** (`import`/`export`), sin bundler. Un fichero = una responsabilidad.
- **Sin atributos inline** (`onclick=...`): listeners con `addEventListener`.
- **i18n ES/VA**: todo texto visible lleva `data-i18n="clave"` en el HTML y la clave existe en `data/i18n-dict.js` **en `es` y en `va`**. Textos dinámicos usan `t('clave')` / `tf('clave', {var})`. Atributos `aria-label` traducibles: `data-i18n-aria="clave"`.
- **Paleta de tema**: las clases Tailwind `ide.*` (`bg-ide-surface`, `text-ide-muted`…) mapean a variables CSS (`var(--ide-*)`) definidas en `css/theme.css` bajo `:root` (oscuro) y `[data-theme="light"]` (claro). **No colores hardcodeados** en paneles nuevos; usar siempre las clases `ide.*` o var() directa.
- **Progreso**: solo vía `markCompleted(section, id)` de `state.js`.
- **Motor**: toda ejecución de Java pasa por `runner/java-engine.js` (`runJava`). No crear accesos directos al CDN.

## Cómo añadir un modo/panel nuevo

1. Sección `<section id="panel-X" class="hidden">` en `index.html`.
2. Pestaña `btn-mode-X` en la cabecera.
3. Registrar en el array de modos de `js/app.js` (`switchMode` + listeners + array de paneles).
4. Módulo `js/x.js` con `initX()` llamado desde `initApp()`.
5. Claves i18n en `data/i18n-dict.js` (es + va).

## MCPs (sesión opencode)

Config global en `~/.config/opencode/opencode.json`: `packet-tracer`, `chrome-devtools`, `codegraph`. El índice `codegraph/` vive en `.codegraph/` (ignorado por git); refrescar con `codegraph init` tras cambios grandes.
