/**
 * App Screen Generator - Interaction-safe panel re-rendering
 * Panels rebuild their HTML on every store change. Doing that while the user is dragging a slider,
 * typing in a field or using a colour picker destroys the control mid-interaction (the drag stops,
 * focus is lost). This defers the rebuild until the interaction ends, then catches up once.
 */

const TEXT_LIKE = 'textarea, input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button])';

/**
 * @param {HTMLElement} container Panel root whose content `render` replaces
 * @param {Function} render Rebuilds the panel
 * @returns {Function} Call instead of `render` when the store changes
 */
export function guardedRender(container, render) {
  let pending = false;
  let pointerDown = false;

  const isBusy = () => {
    const el = document.activeElement;
    return pointerDown || (container.contains(el) && el.matches(TEXT_LIKE));
  };
  const flush = () => {
    if (pending && !isBusy()) {
      pending = false;
      render();
    }
  };

  // A pointer held on a form control = slider drag or picker in progress
  container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('input, select, textarea')) pointerDown = true;
  });
  window.addEventListener('pointerup', () => {
    if (!pointerDown) return;
    pointerDown = false;
    setTimeout(flush);
  });
  container.addEventListener('focusout', () => setTimeout(flush));

  return () => {
    if (isBusy()) pending = true;
    else render();
  };
}
