# HANDSOFF.md — JavaLearn DAM

Handoff para la próxima sesión. Actualizar al terminar cada tarea grande.

## Estado actual (última actualización: 2026-11-18)

- App estática con 450 retos (Bloques / Parsons / Micro-Editor) y motor Java WASM real.
- **Landing de bienvenida**: panel `panel-home` + pestaña «Inicio»; se muestra solo la 1ª vez (flag `javalearn_dam_seen` en localStorage) y siempre vuelve desde la pestaña.
- **Tema claro/oscuro**: interruptor 🌙/☀️ en cabecera; variables CSS en `css/theme.css` (`:root` oscuro, `[data-theme="light"]` claro); persistencia en `javalearn_dam_theme`; respeta `prefers-color-scheme` en la 1ª visita; `theme-color` sincronizado.
- **PWA completa**: `manifest.webmanifest` (standalone, 3 iconos) + `icons/` (SVG fuente → PNG con inkscape) + `sw.js` con 3 capas de caché: shell (precache + stale-while-revalidate), CDN (Tailwind/Fonts, respuestas opacas) y motor unpkg (cache-first). Offline verificado con recarga en modo red caído.
- **Auditoría 300/300 PASS** (ver «Qué se hizo»). Lighthouse: 100/100/100/100 (a11y/best-practices/SEO/agentic).
- **MCPs globales**: `packet-tracer`, `chrome-devtools` (ya cargado en OpenCode), `codegraph` (índice `.codegraph/` refrescado).
- **Docs**: `AGENTS.md` (convenciones) y este `HANDSOFF.md`.

## Qué se hizo en la última sesión

1. Instalación MCP: chrome-devtools (npx) + codegraph + `codegraph init` + `.codegraph/` en `.gitignore`.
2. `AGENTS.md` + `HANDSOFF.md`.
3. Landing `panel-home` (tarjetas de modos, sección del motor, cómo practicar) + pestaña Inicio + intro 1ª vez.
4. Tema claro/oscuro con variables CSS y toggle persistente; pulido de contraste.
5. UX: focus-visible, transiciones entre paneles, botón «Cómo practicar» por modo, `min-w-0` en selects.
6. Verificación e2e (puppeteer-core + Chrome headless): tema, intro 1ª vez, 4 modos, ES/VA, motor real — 0 errores de consola.
7. **Fix de los 13 fallos de auditoría → 300/300 PASS**:
   - `calcularMedia` (3 Editor): `junit-runner` generaba `new int[]{…}` para `double[]` (en JS `5.0` es entero); ahora tipa los arrays desde `act.signature`/`act.params`.
   - `controlarExcepcionDivisionPorCero` (5 Bloques): `10 / 0` constante trapeaba en wasm y **mataba el Worker** (el siguiente test fallaba con «could not fetch message» — de ahí los 5 fallos de matriz); ahora `int cero = 0; … 10 / cero` lanza `ArithmeticException` de verdad.
   - Matrices 2D (5 Bloques): eran daño colateral del trap; sin cambios en el reto.
   - `java-engine.runJava`: reintenta **una vez** con `resetEngine()` si el Worker muere («could not fetch message»).
8. **PWA**: manifest + iconos + SW con precache de shell/CDN; `meta description`; `aria-label` i18n en los 3 selects (`data-i18n-aria`); contraste del footer corregido (`text-ide-warning/80` → sin `/80`).

## Pendientes / ideas futuras

- [ ] Refrescar índice codegraph tras cambios grandes: `codegraph init`.
- [ ] Actualizar caché del SW al publicar (los bumps de `javalearn-shell-v1`/`cdn-v1` purgan versiones viejas automáticamente).
- [ ] Idea: precarga en idle del wasm (7,7 MB) tras la landing para que la 1ª compilación no espere descarga.

## Cómo verificar rápidamente

```bash
python3 -m http.server 8080
# → http://localhost:8080/
```

1. Borrar localStorage (`javalearn_dam_prog`, `javalearn_dam_seen`, `javalearn_dam_theme`) → 1ª visita muestra la landing → «Empezar» → Bloques.
2. Pestaña «Inicio» siempre accesible; ES/VA traduce la landing completa.
3. Toggle ☀️/🌙 persiste al recargar; sin flag, usa `prefers-color-scheme`.
4. Motor: botón «Compilar y Ejecutar» en Bloques descarga el wasm la 1ª vez y ejecuta de verdad.
5. Regresión fuerte: abrir `tools/audit.html` y esperar a `window.__audit.done === true` → **300/300, `failures: []`**.
6. PWA: Application → Service Workers (activated) + cachés `javalearn-shell-v1`/`cdn-v1`; con la red caída, recargar sigue pintando la app.

## Claves de localStorage

| Clave | Contenido |
|---|---|
| `javalearn_dam_prog` | Progreso 3×150 (bloques/parsons/editor) |
| `javalearn_dam_seen` | «1» si el usuario ya vio la landing |
| `javalearn_dam_theme` | `light` \| `dark` |
