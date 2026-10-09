// Run: node tests/translation_manual.check.mjs — checks manual translation workflow without AI
import assert from 'node:assert/strict';
import { Store, activeDoc } from '../js/state/store.js';
import { buildLanguageCopy } from '../js/features/translation/translationService.js';

const store = new Store();
const state = store.getState();

// Setup original English copy
state.screens[0].headline.text = 'Smart Investing Made Easy';
state.screens[0].subtitle.text = 'Start with zero commission today.';
state.screens[0].shapes = [{ id: 'b1', type: 'pill_badge', label: '🔒 Bank-Grade Security' }];

// 1. Verify buildLanguageCopy without AI creates a full clone with zero network/AI calls
const sourceScreens = state.screens;
const sourceFeature = state.feature;
const docs = await buildLanguageCopy([...sourceScreens, sourceFeature], 'en', 'es', false);
const featureCopy = docs.pop();

assert.equal(docs.length, 1, 'screens cloned');
assert.equal(docs[0].headline.text, 'Smart Investing Made Easy', 'original text preserved for manual typing');
assert.equal(docs[0].shapes[0].label, '🔒 Bank-Grade Security', 'badges preserved');

// 2. Add language to store and verify it activates the new language copy
store.addLanguage('es', docs, featureCopy);
assert.equal(store.getState().activeLanguage, 'es', 'active language switched to Spanish');
assert.deepEqual(store.getState().languages, ['en', 'es'], 'both languages listed');

// 3. User manually types translation into the active copy
store.update(s => {
  const doc = activeDoc(s);
  doc.headline.text = 'Inversión Inteligente y Fácil';
  doc.subtitle.text = 'Comienza hoy con cero comisiones.';
  doc.shapes[0].label = '🔒 Seguridad de Nivel Bancario';
});

// Verify Spanish copy has user's typed translation
const currentDoc = activeDoc(store.getState());
assert.equal(currentDoc.headline.text, 'Inversión Inteligente y Fácil', 'Spanish headline updated');
assert.equal(currentDoc.subtitle.text, 'Comienza hoy con cero comisiones.', 'Spanish subtitle updated');
assert.equal(currentDoc.shapes[0].label, '🔒 Seguridad de Nivel Bancario', 'Spanish badge updated');

// 4. Switch back to English and verify original texts were untouched
store.switchLanguage('en');
assert.equal(store.getState().activeLanguage, 'en', 'active language is English');
const enDoc = activeDoc(store.getState());
assert.equal(enDoc.headline.text, 'Smart Investing Made Easy', 'English headline untouched');
assert.equal(enDoc.subtitle.text, 'Start with zero commission today.', 'English subtitle untouched');
assert.equal(enDoc.shapes[0].label, '🔒 Bank-Grade Security', 'English badge untouched');

// 5. Switch back to Spanish and verify typed translations are preserved
store.switchLanguage('es');
const recheckedDoc = activeDoc(store.getState());
assert.equal(recheckedDoc.headline.text, 'Inversión Inteligente y Fácil', 'Spanish headline preserved');
assert.equal(recheckedDoc.subtitle.text, 'Comienza hoy con cero comisiones.', 'Spanish subtitle preserved');

console.log('manual translation checks passed');
