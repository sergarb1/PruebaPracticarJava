/* ==========================================================================
   home — landing de bienvenida (panel-home)
   - CTA «Empezar / Practar» → cambia de modo.
   - CTAs de scroll interno (modos, motor).
   - Botones «❓ Cómo practicar» de cada panel → vuelven a la landing.
   ========================================================================== */
import { switchMode } from './app.js';

export function initHome() {
  document.querySelectorAll('[data-goto-mode]').forEach((el) => {
    el.addEventListener('click', () => switchMode(el.getAttribute('data-goto-mode')));
  });

  document.querySelectorAll('[data-goto-scroll]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = document.getElementById(el.getAttribute('data-goto-scroll'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('.btn-howto').forEach((el) => {
    el.addEventListener('click', () => {
      switchMode('home');
      const target = document.getElementById(el.getAttribute('data-howto') || 'home-howto');
      requestAnimationFrame(() => {
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
}
