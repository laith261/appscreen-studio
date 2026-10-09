/**
 * Unit tests for custom dialog component and functions.
 */

import assert from 'node:assert/strict';

// Set up minimal DOM environment for testing dialog logic in Node
globalThis.document = {
  body: {
    style: {},
    appendChild: (el) => el,
    removeChild: (el) => el
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      style: {},
      innerHTML: '',
      setAttribute: () => {},
      removeAttribute: () => {},
      appendChild: (child) => child,
      removeChild: (child) => child,
      querySelector: (sel) => {
        if (sel === '.custom-dialog-input') return el._input || null;
        if (sel === '.custom-dialog-confirm-btn') return el._confirmBtn || null;
        if (sel === '.custom-dialog-cancel-btn') return el._cancelBtn || null;
        return null;
      },
      querySelectorAll: () => [],
      focus: () => { el._focused = true; },
      remove: () => {},
      addEventListener: (type, handler) => {
        el._handlers = el._handlers || {};
        el._handlers[type] = handler;
      }
    };
    return el;
  }
};
globalThis.window = globalThis;

// Import after minimal DOM is set
const { showDialog, customAlert, customConfirm, customPrompt } = await import('../js/ui/dialog.js');

console.log('Testing Custom Dialogs...');

// 1. Check exports
assert.equal(typeof showDialog, 'function', 'showDialog should be a function');
assert.equal(typeof customAlert, 'function', 'customAlert should be a function');
assert.equal(typeof customConfirm, 'function', 'customConfirm should be a function');
assert.equal(typeof customPrompt, 'function', 'customPrompt should be a function');
console.log('  ✓ Dialog module functions exported correctly');

// 2. Global window attachments
assert.equal(typeof window.customAlert, 'function', 'window.customAlert attached');
assert.equal(typeof window.customConfirm, 'function', 'window.customConfirm attached');
assert.equal(typeof window.customPrompt, 'function', 'window.customPrompt attached');
console.log('  ✓ Global window bindings verified');

// 3. Confirm dialog promise resolution
{
  const dialogPromise = customConfirm({
    title: 'Delete Item?',
    message: 'Are you sure you want to delete this?',
    confirmText: 'Delete',
    isDanger: true
  });
  assert.ok(dialogPromise instanceof Promise, 'customConfirm returns a Promise');
}

// 4. Prompt dialog promise resolution
{
  const promptPromise = customPrompt({
    title: 'Rename',
    message: 'New name:',
    defaultValue: 'My Screen'
  });
  assert.ok(promptPromise instanceof Promise, 'customPrompt returns a Promise');
}

console.log('All dialog unit checks passed successfully!');
