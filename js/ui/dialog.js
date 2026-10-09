/**
 * AppScreen Studio - Custom Dialogs System
 * Modern, accessible replacement for native browser alert, confirm, and prompt.
 * Seamlessly integrates with studio theme, Google Material Symbols, and keyboard navigation.
 */

/**
 * Creates and displays an accessible modal dialog.
 * @param {Object} options
 * @returns {Promise<any>}
 */
export function showDialog(options = {}) {
  return new Promise((resolve) => {
    const {
      title = 'Notice',
      message = '',
      icon = 'info',
      type = 'info', // 'info' | 'warning' | 'danger' | 'confirm' | 'prompt'
      confirmText = 'OK',
      cancelText = 'Cancel',
      danger = false,
      isPrompt = false,
      defaultValue = '',
      placeholder = '',
      showCancel = false
    } = options;

    // Prevent background scrolling
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop custom-dialog-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'custom-dialog-title');

    // Icon variant class
    const iconClass = danger || type === 'danger'
      ? 'dialog-icon-danger'
      : type === 'warning'
      ? 'dialog-icon-warning'
      : type === 'success'
      ? 'dialog-icon-success'
      : 'dialog-icon-info';

    // Card
    const card = document.createElement('div');
    card.className = 'modal-card custom-dialog-card';

    card.innerHTML = `
      <div class="custom-dialog-body">
        <div class="custom-dialog-icon-wrap ${iconClass}">
          <span class="material-symbols-outlined">${escapeHtml(icon)}</span>
        </div>
        <div class="custom-dialog-content">
          <h3 class="custom-dialog-title" id="custom-dialog-title">${escapeHtml(title)}</h3>
          <p class="custom-dialog-message">${escapeHtml(message)}</p>
          ${isPrompt ? `
            <div class="custom-dialog-input-wrap">
              <input type="text" class="custom-dialog-input form-input" id="custom-dialog-input-field" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(placeholder)}" />
            </div>
          ` : ''}
        </div>
        <button type="button" class="modal-close-btn custom-dialog-close" title="Close (Esc)" aria-label="Close">
          <span class="material-symbols-outlined" style="font-size:18px;">close</span>
        </button>
      </div>
      <div class="modal-footer custom-dialog-footer">
        ${showCancel ? `
          <button type="button" class="btn btn-outline btn-sm custom-dialog-cancel-btn">
            ${escapeHtml(cancelText)}
          </button>
        ` : ''}
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm custom-dialog-confirm-btn">
          ${escapeHtml(confirmText)}
        </button>
      </div>
    `;

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    const inputEl = card.querySelector('#custom-dialog-input-field');
    const confirmBtn = card.querySelector('.custom-dialog-confirm-btn');
    const cancelBtn = card.querySelector('.custom-dialog-cancel-btn');
    const closeBtn = card.querySelector('.custom-dialog-close');

    // Auto-focus appropriate control
    const focusTarget = () => {
      if (inputEl) {
        inputEl.focus();
        if (typeof inputEl.select === 'function') inputEl.select();
      } else if (confirmBtn) {
        confirmBtn.focus();
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(focusTarget);
    } else {
      setTimeout(focusTarget, 0);
    }

    let closed = false;
    const cleanup = (result) => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      backdrop.classList.add('dialog-closing');
      setTimeout(() => {
        backdrop.remove();
      }, 150);
      resolve(result);
    };

    const handleConfirm = () => {
      if (isPrompt) {
        cleanup(inputEl ? inputEl.value : '');
      } else {
        cleanup(true);
      }
    };

    const handleCancel = () => {
      if (isPrompt) {
        cleanup(null);
      } else {
        cleanup(false);
      }
    };

    // Click handlers
    if (confirmBtn) confirmBtn.onclick = handleConfirm;
    if (cancelBtn) cancelBtn.onclick = handleCancel;
    if (closeBtn) closeBtn.onclick = handleCancel;
    backdrop.onclick = (e) => {
      if (e.target === backdrop) handleCancel();
    };

    // Keyboard handlers
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      } else if (e.key === 'Enter') {
        // If Enter is pressed inside prompt input, confirm
        if (isPrompt && document.activeElement === inputEl) {
          e.preventDefault();
          handleConfirm();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
  });
}

/**
 * Asynchronous custom alert dialog.
 * @param {string|Object} messageOrOptions
 * @param {Object} [options]
 * @returns {Promise<void>}
 */
export function customAlert(messageOrOptions, options = {}) {
  const opts = typeof messageOrOptions === 'string'
    ? { message: messageOrOptions, ...options }
    : { ...messageOrOptions };

  return showDialog({
    title: opts.title || 'Notification',
    message: opts.message || '',
    icon: opts.icon || (opts.type === 'error' || opts.danger ? 'error' : opts.type === 'warning' ? 'warning' : 'info'),
    type: opts.type || (opts.danger ? 'danger' : 'info'),
    confirmText: opts.confirmText || 'OK',
    danger: !!opts.danger,
    showCancel: false,
    isPrompt: false
  });
}

/**
 * Asynchronous custom confirm dialog.
 * @param {string|Object} messageOrOptions
 * @param {Object} [options]
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
 */
export function customConfirm(messageOrOptions, options = {}) {
  const opts = typeof messageOrOptions === 'string'
    ? { message: messageOrOptions, ...options }
    : { ...messageOrOptions };

  return showDialog({
    title: opts.title || 'Confirm Action',
    message: opts.message || '',
    icon: opts.icon || (opts.danger ? 'delete' : 'help'),
    type: opts.danger ? 'danger' : (opts.type || 'confirm'),
    confirmText: opts.confirmText || (opts.danger ? 'Delete' : 'Confirm'),
    cancelText: opts.cancelText || 'Cancel',
    danger: !!opts.danger,
    showCancel: true,
    isPrompt: false
  });
}

/**
 * Asynchronous custom prompt dialog.
 * @param {string|Object} messageOrOptions
 * @param {string} [defaultValue]
 * @param {Object} [options]
 * @returns {Promise<string|null>} Resolves to entered string, or null if cancelled
 */
export function customPrompt(messageOrOptions, defaultValue = '', options = {}) {
  let opts = {};
  if (typeof messageOrOptions === 'string') {
    opts = { message: messageOrOptions, defaultValue, ...options };
  } else {
    opts = { ...messageOrOptions };
  }

  return showDialog({
    title: opts.title || 'Input Required',
    message: opts.message || '',
    icon: opts.icon || 'edit',
    type: 'prompt',
    defaultValue: opts.defaultValue ?? '',
    placeholder: opts.placeholder || '',
    confirmText: opts.confirmText || 'Save',
    cancelText: opts.cancelText || 'Cancel',
    showCancel: true,
    isPrompt: true
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Make globally accessible for all pages and components
if (typeof window !== 'undefined') {
  window.customAlert = customAlert;
  window.customConfirm = customConfirm;
  window.customPrompt = customPrompt;
  window.customDialog = {
    alert: customAlert,
    confirm: customConfirm,
    prompt: customPrompt
  };
}
