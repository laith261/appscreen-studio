/**
 * App Screen Generator - Font Picker
 * A dropdown where every font is previewed in its own typeface.
 * Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Enter picks, Esc closes.
 */

import { POPULAR_FONTS, loadFont } from '../features/text/fontManager.js';

/**
 * Replaces `el` with a font picker.
 * @param {HTMLElement} el Placeholder element
 * @param {string} value Current font family
 * @param {Function} onChange Called with the chosen font family
 * @param {string} label Accessible name, e.g. "Headline font"
 */
export function mountFontPicker(el, value, onChange, label = 'Font') {
  const current = POPULAR_FONTS.find(f => f.name === value) || POPULAR_FONTS[0];
  loadFont(current.name);

  const root = document.createElement('div');
  root.className = 'font-picker';
  root.innerHTML = `
    <button type="button" class="font-picker-btn form-select" aria-haspopup="listbox" aria-expanded="false"></button>
    <ul class="font-picker-list hidden" role="listbox" tabindex="-1"></ul>
  `;
  const btn = root.querySelector('.font-picker-btn');
  const list = root.querySelector('.font-picker-list');
  btn.setAttribute('aria-label', `${label}: ${current.name}`);
  btn.textContent = current.name;
  btn.style.fontFamily = `'${current.name}', sans-serif`;

  POPULAR_FONTS.forEach(f => {
    const li = document.createElement('li');
    li.className = 'font-picker-option';
    li.setAttribute('role', 'option');
    li.tabIndex = -1;
    li.dataset.font = f.name;
    li.setAttribute('aria-selected', String(f.name === current.name));
    li.innerHTML = '<span class="font-picker-name"></span><span class="font-picker-sample">Aa</span><small class="font-picker-cat"></small>';
    li.querySelector('.font-picker-name').textContent = f.name;
    li.querySelector('.font-picker-cat').textContent = f.category;
    li.querySelector('.font-picker-name').style.fontFamily = `'${f.name}', sans-serif`;
    li.querySelector('.font-picker-sample').style.fontFamily = `'${f.name}', sans-serif`;
    list.appendChild(li);
  });
  const options = [...list.children];

  const isOpen = () => !list.classList.contains('hidden');
  const open = () => {
    POPULAR_FONTS.forEach(f => loadFont(f.name)); // previews need every font
    list.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    (options.find(o => o.dataset.font === current.name) || options[0]).focus();
    document.addEventListener('pointerdown', onOutside, true);
  };
  const close = (refocus = true) => {
    list.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside, true);
    if (refocus) btn.focus();
  };
  const onOutside = (e) => { if (!root.contains(e.target)) close(false); };
  const pick = (name) => {
    close();
    if (name !== current.name) onChange(name);
  };

  btn.onclick = () => (isOpen() ? close() : open());
  btn.onkeydown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
  };
  list.onclick = (e) => {
    const opt = e.target.closest('.font-picker-option');
    if (opt) pick(opt.dataset.font);
  };
  list.onkeydown = (e) => {
    const i = options.indexOf(document.activeElement);
    const go = (n) => { e.preventDefault(); options.at(Math.max(0, Math.min(options.length - 1, n))).focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(options.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) pick(options[i].dataset.font); }
    else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); close(); }
  };

  el.replaceWith(root);
  return root;
}
