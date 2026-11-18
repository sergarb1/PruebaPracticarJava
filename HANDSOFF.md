# HANDSOFF.md — JavaLearn DAM

Handoff para la próxima sesión. Actualizar al terminar cada tarea grande.

## Estado actual (última actualización: 2026-11-18)

- App estática con 450 retos (Bloques / Parsons / Micro-Editor) y motor Java WASM real.
- **Landing de bienvenida**: panel `panel-home` + pestaña «Inicio»; se muestra solo la 1ª vez (flag `javalearn_dam_seen` en localStorage) y siempre vuelve desde la pestaña.
- **Tema claro/oscuro**: interruptor 🌙/☀️ en cabecera; variables CSS en `css/theme.css` (`:root` oscuro, `[data-theme="light"]` claro); persistencia en `javalearn_dam_theme`; respeta `prefers-color-scheme` en la 1ª visita.
- **MCPs globales instalados** (en `~/.config/opencode/opencode.json`): `packet-tracer`, `chrome-devtools`, `codegraph`. Índice `.codegraph/` creado (18 ficheros, ~179 nodos).
- **Docs**: `AGENTS.md` (convenciones) y este `HANDSOFF.md`.

## Qué se hizo en la última sesión

1. Instalación MCP: chrome-devtools (npx) + codegraph (ya instalado, se añadió a config global) + `codegraph init` + `.codegraph/` en `.gitignore`.
2. `AGENTS.md` + `HANDSOFF.md`.
3. Landing `panel-home` (tarjetas de modos, sección del motor, cómo practicar) + pestaña Inicio + intro 1ª vez.
4. Tema claro/oscuro con variables CSS y toggle persistente; pulido de contraste.
5. UX: focus-visible, transiciones entre paneles, botón «Cómo practicar» por modo.
6. Verificación e2e (puppeteer-core + Chrome headless): tema, intro 1ª vez, 4 modos, ES/VA, `min-w-0` en selects (evita solape del botón «Cómo practicar» con los filtros), motor real ejecutando («javac real… Salida: 18 ✔») — 0 errores de consola.
7. Auditoría `tools/audit.html`: **300/300 ejecuciones**; 13 fallos (10 Bloques: TeaVM `divide by zero`/matrices 2D; 3 Editor: `calcularMedia` con `int[]→double[]` en la solución oficial). **Confirmados preexistentes**: mismo resultado en worktree limpio de HEAD. No tocar runners/datos por este motivo sin decisión explícita.

## Pendientes / ideas futuras

- [ ] Verificar con chrome-devtools MCP (reiniciar opencode para cargarlo) contraste y flujos en Chrome.
- [ ] Refrescar índice codegraph tras cambios grandes: `codegraph init`.
- [ ] Posible PWA completa (manifest + iconos) — el SW ya cachea el motor.
- [ ] Decidir si se arreglan los 13 fallos de auditoría (datos `editor-methods.js` `calcularMedia` + retos de excepciones/matrices en Bloques).

## Cómo verificar rápidamente

```bash
python3 -m http.server 8080
# → http://localhost:8080/
```

1. Borrar localStorage (`javalearn_dam_prog`, `javalearn_dam_seen`, `javalearn_dam_theme`) → 1ª visita muestra la landing → «Empezar» → Bloques.
2. Pestaña «Inicio» siempre accesible; ES/VA traduce la landing completa.
3. Toggle ☀️/🌙 persiste al recargar; sin flag, usa `prefers-color-scheme`.
4. Motor: botón «Compilar y Ejecutar» en Bloques descarga el wasm la 1ª vez y ejecuta de verdad.
5. Regresión fuerte: abrir `tools/audit.html` y esperar a `window.__audit.done === true` («Auditoría completada 300 / 300»); comparar fallos con la lista preexistente de arriba.

## Claves de localStorage

| Clave | Contenido |
|---|---|
| `javalearn_dam_prog` | Progreso 3×150 (bloques/parsons/editor) |
| `javalearn_dam_seen` | «1» si el usuario ya vio la landing |
| `javalearn_dam_theme` | `light` \| `dark` |
