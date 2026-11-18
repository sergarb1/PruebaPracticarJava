# PruebaPracticarJava — JavaLearn DAM

Plataforma interactiva para aprender Java con **450 retos** (150 Bloques, 150 Parsons, 150 Micro-Editor) y **compilación real de Java en el navegador** — sin backend, sin build, sin dependencias de servidor.

> 🚀 **En vivo:** [https://sergarb1.github.io/PruebaPracticarJava/](https://sergarb1.github.io/PruebaPracticarJava/)

## ✨ Características

- **3 modos de práctica**
  - 🧱 **Bloques**: arrastra bloques de código y genera un programa Java completo.
  - 🧩 **Parsons**: reordena y sangra líneas de código hasta reconstruir el algoritmo (con botón **«Compilar código»** que verifica que tu solución compila de verdad).
  - ✍️ **Micro-Editor**: escribe Java a mano y ejecuta **tests JUnit reales**.
- **Motor Java real en el navegador**: `@live-codes/java-wasm` (javac + TeaVM → WebAssembly, ~7,7 MB desde unpkg CDN, cacheado con Service Worker). Compila y ejecuta tu código de verdad.
- **Modo simulador de respaldo**: si no hay red o se abre con `file://`, la app funciona en modo simulador legacy con aviso amber.
- **Bilingüe ES / VA** (valenciano) vía atributos `data-i18n`.
- **Progreso guardado** en `localStorage` (`javalearn_dam_prog`) con barra global `x/450`.
- Filtros por dificultad (Fácil / Medio / Avanzado) y solución oficial en modal.

## 🏗️ Arquitectura

Aplicación **estática**: módulos ES nativos (`<script type="module">`), Tailwind por CDN, **sin build ni npm**.

```
index.html            ← entrada (GitHub Pages la sirve por defecto)
css/theme.css         ← tipografías (Inter + Fira Code) y scrollbars
sw.js                 ← Service Worker: caché del motor wasm (unpkg)
data/
  i18n-dict.js        ← diccionario ES/VA
  topics.js           ← catálogo de algoritmos (150 retos)
  editor-methods.js   ← métodos del micro-editor (150 retos)
  activities.js       ← generadores de las 3×150 actividades
  java-support.js     ← preludio Java (clase Alumno)
js/
  app.js              ← orquestador (modos, idioma, registro SW)
  i18n.js state.js utils.js
  blocks.js parsons.js editor.js
  runner/
    java-engine.js    ← motor wasm: runJava / classifyResult / banner
    blocks-runner.js  ← ejecución real de Bloques
    junit-runner.js   ← driver de tests JUnit reales
    parsons-compile.js← «Compilar código» de Parsons
    legacy-fallback.js← simulador legacy (modo respaldo)
legacy/
  AplicacionJAVA-original.html  ← monolito original (referencia)
tools/
  audit.html          ← auditoría de compatibilidad (300 compilaciones)
  INTERFACES.md       ← contrato de módulos
```

## 🧪 Auditoría de compatibilidad

`tools/audit.html` compila con el motor real **todos** los códigos de Bloques y las soluciones oficiales del Micro-Editor (300 casos) y comprueba salidas/tests. Expone `window.__audit` para automatización y termina con `[AUDIT] DONE` en consola.

## 🖥️ Ejecución local

Servir por HTTP (los módulos ES y el Worker del motor no funcionan con `file://`):

```bash
python -m http.server 8080
# → http://localhost:8080/
```

## 📄 Licencia / Autoría

Material educativo de **Mara Vañó** (DAM). El monolito original se conserva en `legacy/` como referencia.
