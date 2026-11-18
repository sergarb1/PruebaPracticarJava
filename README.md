# PruebaPracticarJava — JavaLearn DAM

Plataforma **estática** para practicar Java con **450 retos** (150 Bloques · 150 Parsons · 150 Micro-Editor) y **compilación y ejecución reales de Java en el navegador** — sin backend, sin build y sin dependencias de servidor. Pensada para el ciclo **DAM** (Desarrollo de Aplicaciones Multiplataforma).

> 🚀 **En vivo:** [https://sergarb1.github.io/PruebaPracticarJava/](https://sergarb1.github.io/PruebaPracticarJava/)
>
> 📦 **Instalable como app (PWA)**: funciona **offline** una vez visitada y se puede instalar en escritorio o móvil (botón «📱 Instalar» en la cabecera).

---

## ✨ Qué ofrece

### 3 modos de práctica (450 retos en total)

| Modo | Qué haces | Cómo se verifica |
|---|---|---|
| 🧱 **Bloques** | Montas el programa a partir de una paleta de fragmentos (arrastrando o con «+»). | Se **compila y ejecuta** con javac real y se compara tu salida con la esperada. |
| 🧩 **Parsons** | Reordenas y sangras líneas de código hasta reconstruir el algoritmo (con distractores). | Botón **«Compilar código»**: comprueba que tu orden **compila de verdad**. |
| ✍️ **Micro-Editor** | Escribes Java a mano sobre una plantilla con firma obligatoria. | **Tests JUnit reales**: un driver genera `Main.java`, compila tu solución y ejecuta los casos. |

- **Filtros por dificultad** (Fácil / Medio / Avanzado) y selector de actividad en cada modo.
- **Solución oficial** en modal de comparación (también en la landing, «Cómo practicar»).
- **Progreso guardado** en `localStorage` (`javalearn_dam_prog`) con barra global **x/450**.

### Motor Java real (no es un simulador)

- Usa [`@live-codes/java-wasm`](https://unpkg.com/@live-codes/java-wasm) (**javac + TeaVM → WebAssembly**), ~7,7 MB desde unpkg, **cacheado con Service Worker** (solo la primera visita).
- Compila tu código, lo ejecuta y devuelve `stdout`/`stderr`/código de salida; un banner de estado muestra las fases («Compilando…», «Ejecutando…»).
- **Timeout de 20 s** con reinicio automático del Worker (bucles infinitos) y **reintento** si el Worker muere a mitad de ejecución.
- **Modo simulador de respaldo** (`legacy/`): si no hay red o se abre con `file://`, la app sigue funcionando en modo simulador con aviso ámbar (el código no se compila de verdad).

### Interfaz y experiencia

- **Landing de bienvenida** (`Inicio`): se muestra solo en la **1ª visita** y siempre puedes volver desde la pestaña «🏠 Inicio»; incluye accesos directos a los 3 modos, qué es el motor y «Cómo practicar».
- **Tema claro/oscuro** (paletas Mocha / Latte): botón ☀️/🌙 en la cabecera, persistente, respeta `prefers-color-scheme` en la 1ª visita y sincroniza el `theme-color` del navegador.
- **Bilingüe ES / VA** (valenciano): todos los textos visibles usan `data-i18n` y se traducen también los `aria-label` (`data-i18n-aria`). Cambio de idioma en caliente, sin recargar.
- **Accesibilidad**: `:focus-visible`, contraste verificado con Lighthouse (100/100), etiquetas en los selects, botón de instalación con `aria-label` traducido.
- **Transiciones** suaves entre paneles (respetando `prefers-reduced-motion`).

### PWA (instalable + offline)

- `manifest.webmanifest` con **3 iconos** (192 / 512 / maskable) generados desde `icons/icon.svg`.
- Service Worker con **3 capas de caché**:

  | Caché | Qué guarda | Estrategia |
  |---|---|---|
  | `javalearn-shell-v1` | HTML/CSS/JS/datos/iconos de la app | *precache* al instalar + *stale-while-revalidate* |
  | `javalearn-cdn-v1` | Tailwind CDN y Google Fonts (respuestas opacas) | *stale-while-revalidate* |
  | `javalearn-engine-v1` | Motor wasm de unpkg | *cache-first* |

- Resultado: **recarga con la red caída y la app sigue viva** (estilos, tipografía y tema incluidos).
- **Instalación**:
  - **Chrome/Edge (escritorio)**: botón «📱 Instalar» de la cabecera o el icono de la barra de direcciones.
  - **Android (Chrome)**: menú ⋮ → «Instalar app» o «Añadir a pantalla inicio».
  - **iOS (Safari)**: no hay botón automático → **Compartir → Añadir a pantalla inicio**.

---

## 🚀 Ejecución local

Solo necesitas cualquier servidor estático. **No hay `npm install`, ni bundler, ni backend.**

```bash
python3 -m http.server 8080
# → http://localhost:8080/
```

> ⚠️ **No abras `index.html` con `file://`**: los módulos ES y el Worker del motor no funcionan bajo `file://`. Usa siempre HTTP (en local o GitHub Pages).

En GitHub Pages no hay que configurar nada: la rama `main` se sirve tal cual (entrada `index.html`).

---

## 🏗️ Arquitectura

Aplicación **estática** con módulos ES nativos (`<script type="module">`), **Tailwind por CDN** y un Service Worker. Un fichero = una responsabilidad.

```
index.html              ← entrada única: cabecera, 4 paneles + landing, modal
css/theme.css           ← variables de tema (oscuro/claro), tipografías, scrollbars,
                           focus-visible, animación .panel-in
sw.js                   ← Service Worker: shell + CDN + motor (ver tabla de arriba)
manifest.webmanifest    ← PWA: nombre, start_url, iconos, standalone
icons/                  ← icon.svg / icon-maskable.svg + PNG (192/512/maskable/apple)
data/
  i18n-dict.js          ← diccionario ES/VA (101 claves; AÑADIR SIEMPRE en ambos)
  topics.js             ← catálogo de algoritmos (código + salida esperada)
  editor-methods.js     ← métodos del Micro-Editor (firma, tests, solución oficial)
  activities.js         ← generadores de las 3×150 actividades
  java-support.js       ← preludio Java (clase de apoyo Alumno)
js/
  app.js                ← orquestador: modos, idioma, tema, intro 1ª vez,
                          instalación PWA, registro del SW
  i18n.js               ← t()/tf()/setLanguage(); actualiza [data-i18n] y
                          [data-i18n-aria] y despacha 'languagechange'
  state.js              ← progreso en localStorage + barra x/450
  home.js               ← landing: CTAs y «Cómo practicar»
  blocks.js parsons.js editor.js   ← un módulo por panel
  utils.js              ← helpers compartidos (escapeHtml, badges…)
  runner/
    java-engine.js      ← motor wasm: runJava / classifyResult / banner / reset
    blocks-runner.js    ← ejecución real de Bloques
    junit-runner.js     ← driver de tests JUnit reales (genera Main.java)
    parsons-compile.js  ← «Compilar código» de Parsons
    legacy-fallback.js  ← simulador legacy (respaldo sin red/file://)
legacy/
  AplicacionJAVA-original.html  ← monolito original (referencia, no tocar)
tools/
  audit.html            ← auditoría de 300 compilaciones con el motor real
  INTERFACES.md         ← contrato de módulos
AGENTS.md / HANDSOFF.md ← convenciones del repo / handoff de sesión
```

### Flujo de ejecución (ej. Bloques)

```
bloques.js (panel) ──workspace──▶ blocks-runner.buildMainSource()
                                        │  JAVA_PRELUDE + public class Main
                                        ▼
                              java-engine.runJava(fuente)
                                        │  Worker + @live-codes/java-wasm
                                        ▼
                              classifyResult(res) → compile-error | runtime-error | ok
                                        │
                                        ▼
                              terminal del panel (+ markCompleted si todo cuadra)
```

El Micro-Editor sigue el mismo camino pero con `junit-runner.buildTestDriver()`, que **genera un driver `Main`** con un bloque `try/catch` por test e imprime líneas `TEST|n|PASS|…` que se parsean después.

### Convenciones clave

- **Tema**: clases Tailwind `ide.*` (`bg-ide-surface`, `text-ide-muted`…) → variables CSS `var(--ide-*)` en `css/theme.css` (triplets RGB para que funcionen los modificadores de opacidad: `text-ide-warning/80`). **Nada de colores hardcodeados** en UI nueva.
- **i18n**: todo texto visible lleva `data-i18n="clave"` y la clave existe **en `es` y en `va`**. Dinámicos: `t('clave')` / `tf('clave', {var})`. Atributos aria: `data-i18n-aria="clave"`.
- **Progreso**: solo a través de `markCompleted(section, id)` de `state.js`.
- **Motor**: toda ejecución de Java pasa por `runJava()` de `runner/java-engine.js`. No crear accesos directos al CDN.

---

## 🧪 Verificación y calidad

### Auditoría (la más fuerte)

Abre **`tools/audit.html`** con el servidor local en marcha. Compila con el motor real **los 150 programas de Bloques + las 150 soluciones oficiales del Micro-Editor (300 casos)** y comprueba salidas y tests.

- Estado actual: **300/300 PASS, 0 fallos** (verificado también contra un worktree limpio de `HEAD`).
- Expone `window.__audit` (`{ done, blocks, editor, failures }`) para automatización con Puppeteer/CDN.
- tarda ~4–5 minutos (descarga y usa el wasm real).

### Lighthouse

Última medición (desktop, navegación): **Accesibilidad 100 · Best Practices 100 · SEO 100 · Agentic 100**.

### Prueba manual rápida

1. Borra las claves `javalearn_dam_*` del `localStorage` → 1ª visita: landing → «Empezar» → Bloques.
2. Cambia ES/VA: la landing, los botones y los `aria-label` se traducen.
3. Toggle ☀️/🌙 → recarga → el tema persiste.
4. «Compilar y Ejecutar» en Bloques → la 1ª vez descarga el wasm y ejecuta de verdad.
5. Apaga la red (DevTools → Offline) → recarga: la app sigue pintando; el botón «Instalar» aparece cuando el navegador la considera instalable.

---

## 🛠️ Personalización

**Añadir retos**

- Bloques/Parsons: añade una entrada en `data/topics.js` (`code` con una línea por sentencia + `val` con la salida esperada). El generador crea las variantes de los 3 niveles.
- Micro-Editor: añade el método en `data/editor-methods.js` con `ret`, `params`, `javaBody`, `tests` y descripción ES/VA. El tipado de arrays de los tests se toma de la firma (`params`/`signature`).

**Añadir textos**: nueva clave en `data/i18n-dict.js` **en `es` y en `va`** (paridad verificable con un `Object.keys`).

**Añadir un modo/panel nuevo** (resumen; detalles en `AGENTS.md`): sección en `index.html` → pestaña en la cabecera → registrar en `MODES` de `js/app.js` → módulo `js/x.js` con `initX()` → claves i18n.

---

## 📚 Documentación del repo

| Fichero | Qué contiene |
|---|---|
| `AGENTS.md` | Convenciones, arquitectura y comandos (guía para colaborar sin romper nada). |
| `HANDSOFF.md` | Estado actual, qué se hizo en la última sesión y pendientes. |
| `tools/INTERFACES.md` | Contrato de los módulos ES entre sí. |
| `legacy/` | Monolito original conservado como referencia. |

---

## ⚠️ Limitaciones conocidas

- **`file://` no soportado** → sirve siempre por HTTP.
- El motor es un **subconjunto de Java (TeaVM)**: no todo el lenguaje compila (p. ej. algunas APIs avanzadas). Los retos del catálogo están adaptados y verificados con la auditoría.
- **iOS** no dispara `beforeinstallprompt` → instalación manual desde Safari (Compartir).
- Con el SW, los cambios nuevos llegan al usuario en la **2ª recarga** (*stale-while-revalidate* actualiza en segundo plano).

---

## 📄 Licencia / Autoría

Material educativo de **Mara Vañó** (DAM). El monolito original se conserva en `legacy/` como referencia.
