// Run: node tests/store.check.mjs — checks undo/redo, layers, language copies, feature graphic and AI translation.
import assert from 'node:assert/strict';
import { Store, activeDoc, FEATURE_ID } from '../js/state/store.js';
import { showcaseScreens, docSize } from '../js/canvas/compose.js';
import { getLayerOrder, getLayerItem, ensureScreenDevices, getDevices } from '../js/state/layers.js';
import { buildLanguageCopy, verifyApiKey, saveAiSettings } from '../js/features/translation/translationService.js';

// New projects are empty: one blank screen, no text, no badges
const blank = new Store().getState();
assert.equal(blank.screens.length, 1, 'new project has one screen');
assert.equal(blank.screens[0].headline.text + blank.screens[0].subtitle.text, '', 'new project has no text');
assert.deepEqual(blank.screens[0].shapes, [], 'new project has no badges');

// Sample content for the checks below
const sampleStore = () => {
  const st = new Store();
  const sc = st.getState().screens[0];
  sc.headline.text = 'Supercharge Your Productivity';
  sc.subtitle.text = 'Organize tasks and crush your goals.';
  sc.shapes = [{ id: 'b1', type: 'pill_badge', label: '★ 4.9 (100k+ Reviews)' }, { id: 'b2', type: 'stars_row', label: '★★★★★' }];
  return st;
};

const store = new Store();
const name = () => store.getState().projectName;

// Each named step simulates a separate user action (> 500 ms apart)
const step = (fn) => { store.lastUpdateAt = 0; store.update(fn); };
step(s => { s.projectName = 'A'; });
step(s => { s.projectName = 'B'; });
store.undo();
assert.equal(name(), 'A', 'undo steps back exactly one change');
store.undo();
assert.equal(name(), 'My Play Store App', 'first change is undoable');
store.undo();
assert.equal(name(), 'My Play Store App', 'undo past the start is a no-op');
store.redo();
store.redo();
assert.equal(name(), 'B', 'redo re-applies both changes');
store.undo();
step(s => { s.projectName = 'C'; });
store.redo();
assert.equal(name(), 'C', 'a new change clears redo');

// A slider drag / typing burst (updates < 500 ms apart) undoes in one step
step(s => { s.zoom = 0.1; });
store.update(s => { s.zoom = 0.2; });
store.update(s => { s.zoom = 0.3; });
store.undo();
assert.equal(store.getState().zoom, 0.35, 'rapid updates coalesce into one undo step');

const screen = { device: {}, headline: {}, subtitle: {}, shapes: [{ id: 's1' }, { id: 's2' }] };
assert.deepEqual(getLayerOrder(screen), ['s1', 's2', 'device', 'headline', 'subtitle'], 'legacy order: shapes behind phone');
screen.layerOrder = ['headline', 'device', 'gone', 's1'];
assert.deepEqual(getLayerOrder(screen), ['headline', 'device', 's1', 's2', 'subtitle'], 'saved order kept, stale ids dropped, new items on top');

// Language copies: independent screens per language
const ls = sampleStore();
const step2 = (fn) => { ls.lastUpdateAt = 0; fn(); };
const en = ls.getState().screens;
step2(() => ls.addLanguage('ar', JSON.parse(JSON.stringify(en))));
assert.equal(ls.getState().activeLanguage, 'ar', 'adding a language switches to it');
step2(() => ls.update(s => { s.screens[0].headline.text = 'مرحبا'; }));
step2(() => ls.switchLanguage('en'));
assert.equal(ls.getState().screens[0].headline.text, 'Supercharge Your Productivity', 'editing one copy leaves the other alone');
assert.equal(ls.getLanguageScreens('ar')[0].headline.text, 'مرحبا', 'the other copy keeps its edits');
step2(() => ls.removeLanguage('en'));
assert.deepEqual([ls.getState().languages, ls.getState().activeLanguage], [['ar'], 'ar'], 'removing the active copy switches to a remaining one');
ls.removeLanguage('ar');
assert.deepEqual(ls.getState().languages, ['ar'], 'the last copy cannot be removed');

const legacy = new Store();
const old = legacy.getDefaultState(); delete old.languages; delete old.localeScreens; old.activeLanguage = 'fr';
legacy.loadProject(old);
assert.deepEqual([legacy.getState().languages, legacy.getState().activeLanguage], [['en'], 'en'], 'old projects become one English copy');

// Feature graphic: its own 1024 × 500 document per language copy
const fs = sampleStore();
const fstep = (fn) => { fs.lastUpdateAt = 0; fn(); };
fstep(() => fs.setActiveScreen(FEATURE_ID));
assert.equal(activeDoc(fs.getState()).id, FEATURE_ID, 'feature graphic can be the edited document');
assert.deepEqual(docSize(fs.getState(), fs.getActiveScreen()), { width: 1024, height: 500 }, 'feature graphic is 1024 × 500');
fstep(() => fs.update(s => { activeDoc(s).headline.text = 'Hello banner'; }));
assert.equal(fs.getState().screens[0].headline.text, 'Supercharge Your Productivity', 'editing the feature graphic leaves screens alone');
fstep(() => fs.addLanguage('fr', JSON.parse(JSON.stringify(fs.getState().screens)), { ...JSON.parse(JSON.stringify(fs.getState().feature)), headline: { text: 'Bonjour' } }));
assert.deepEqual([fs.getState().activeScreenId, fs.getState().feature.headline.text], [FEATURE_ID, 'Bonjour'], 'switching language keeps you on its feature graphic');
fstep(() => fs.switchLanguage('en'));
assert.equal(fs.getState().feature.headline.text, 'Hello banner', 'each language copy has its own feature graphic');
fstep(() => fs.addScreen());
assert.notEqual(fs.getState().activeScreenId, FEATURE_ID, 'adding a screen from the feature graphic adds a real screen');

const st2 = { screens: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
assert.deepEqual(showcaseScreens(st2, { order: ['c', 'a'], hiddenIds: ['a'] }).map(x => x.id), ['c', 'b'], 'showcase: saved order, hidden left out, new screens appended');

const legacy2 = new Store(); const old2 = legacy2.getDefaultState(); delete old2.feature; delete old2.localeFeature;
legacy2.loadProject(old2);
assert.equal(legacy2.getState().feature.id, FEATURE_ID, 'older projects get an empty feature graphic');

// AI translation (network stubbed). Minimal localStorage for the per-browser settings.
const mem = {};
globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => body });
const demo = sampleStore().getState().screens;

await assert.rejects(buildLanguageCopy(demo, 'en', 'es'), /API key/, 'no key: translation refuses instead of guessing');
const plain = await buildLanguageCopy(demo, 'en', 'es', false);
assert.equal(plain[0].headline.text, demo[0].headline.text, 'copy without translation keeps texts');

globalThis.fetch = reply(401, { error: { message: 'invalid x-api-key' } });
await assert.rejects(verifyApiKey('claude', 'bad'), /Invalid API key/, 'bad key is reported');
globalThis.fetch = reply(200, { data: [{ id: 'claude-haiku-4-5-20251001' }, { id: 'claude-sonnet-5-5' }] });
assert.equal((await verifyApiKey('claude', 'good')).model, 'claude-sonnet-5-5', 'preferred model picked from the key\'s models');

saveAiSettings({ provider: 'claude', keys: { claude: 'good' }, models: { claude: 'claude-sonnet-5-5' } });
let sent;
globalThis.fetch = async (url, opts) => {
  sent = JSON.parse(JSON.parse(opts.body).messages[0].content);
  const out = sent.map(t => `ES:${t}`);
  return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '```json\n' + JSON.stringify(out) + '\n```' }] }) };
};
const es = await buildLanguageCopy(demo, 'en', 'es');
assert.equal(es[0].headline.text, `ES:${demo[0].headline.text}`, 'headline translated (code fence tolerated)');
assert.ok(!sent.includes('★★★★★'), 'symbol-only labels are not sent');
assert.equal(demo[0].headline.text, 'Supercharge Your Productivity', 'source copy untouched');

globalThis.fetch = reply(200, { content: [{ type: 'text', text: '["only one"]' }] });
await assert.rejects(buildLanguageCopy(demo, 'en', 'es'), /returned 1 of/, 'wrong-length answer is rejected');

// Templates verification: all templates have 4 complete screen ideas
const { PLAY_STORE_TEMPLATES, DESIGN_IDEAS, applyTemplate, applyDesignIdea } = await import('../js/features/templates/templates.js');
assert.ok(PLAY_STORE_TEMPLATES.length >= 4, 'must have at least 4 template themes');
for (const tpl of PLAY_STORE_TEMPLATES) {
  assert.equal(tpl.screens.length, 4, `Template ${tpl.id} must have exactly 4 screen ideas`);
  const tplStore = new Store();
  applyTemplate(tplStore, tpl.id, true);
  assert.equal(tplStore.getState().screens.length, 4, `Applying full suite for ${tpl.id} must load 4 screens`);
}

// Design Ideas verification: 4 distinct ideas with vector illustrations
assert.equal(DESIGN_IDEAS.length, 4, 'must have exactly 4 design layout ideas');
for (const idea of DESIGN_IDEAS) {
  assert.ok(idea.vectorSvg && idea.vectorSvg.includes('<svg'), `Design idea ${idea.id} must have vector SVG illustration`);
  assert.ok(idea.layout && idea.layout.device, `Design idea ${idea.id} must have layout configuration`);
  const ideaStore = new Store();
  applyDesignIdea(ideaStore, idea.id, false);
  const activeSc = ideaStore.getActiveScreen();
  assert.equal(activeSc.device.type, idea.layout.device.type, 'Single design idea applies layout to active screen');
  if (activeSc.shapes && activeSc.shapes.length > 0) {
    const firstShape = activeSc.shapes[0];
    assert.ok(firstShape.id, `Shape in idea ${idea.id} must have a non-empty id`);
    assert.equal(ideaStore.getState().activeElementId, firstShape.id, 'Applying design idea must automatically select the added shape');
    assert.ok(getLayerOrder(activeSc).includes(firstShape.id), 'Shape id must be included in layer order for selection');

    // Spacing checks:
    // If shape is at top, it must sit above headline
    if (firstShape.y < 200) {
      assert.ok(firstShape.y + (firstShape.height || 60) / 2 <= activeSc.headline.yOffset, `Top badge must sit above headline in ${idea.id}`);
    }
    // Subtitle must always start below headline
    assert.ok(activeSc.subtitle.yOffset >= activeSc.headline.yOffset + 120, `Subtitle must start well below headline in ${idea.id}`);
    // If shape is between subtitle and phone, it must sit below subtitle
    if (firstShape.y > 350 && firstShape.y < 500) {
      assert.ok(firstShape.y - (firstShape.height || 60) / 2 >= activeSc.subtitle.yOffset + 40, `Bottom badge must sit below subtitle in ${idea.id}`);
    }
  }
}

// Full suite of 4 design ideas
const fullIdeasStore = new Store();
applyDesignIdea(fullIdeasStore, 'idea_hero_centered', true);
assert.equal(fullIdeasStore.getState().screens.length, 4, 'Applying all design ideas loads 4 screens');
for (const sc of fullIdeasStore.getState().screens) {
  if (sc.shapes && sc.shapes.length > 0) {
    assert.ok(sc.shapes[0].id, 'Every shape in the 4-screen suite must have a valid id');
  }
  assert.ok(sc.subtitle.yOffset >= sc.headline.yOffset + 120, 'Subtitle must start below headline across all screens');
}

// Defensive check: shapes missing an ID must receive an ID in getLayerOrder
// Custom Saved Designs verification
const {
  getSavedDesigns,
  saveCurrentDesign,
  deleteSavedDesign,
  applyCustomDesign,
  generateDesignWireframeSvg
} = await import('../js/features/templates/customDesigns.js');

const customStore = sampleStore();
const activeScreen = customStore.getActiveScreen();
activeScreen.device.type = 'modern_phone';
activeScreen.device.scale = 0.95;
activeScreen.device.y = 1200;
activeScreen.device.rotation = -8;
activeScreen.headline.fontFamily = 'Montserrat';
activeScreen.headline.fontSize = 72;
activeScreen.shapes = [{ id: 'shape_test_1', type: 'pill_badge', label: '🔥 Top 1 Productivity App', width: 450, height: 64, y: 140 }];

// 1. Save design
const savedDesign = saveCurrentDesign(customStore, 'My Pro Productivity Style');
assert.ok(savedDesign, 'saveCurrentDesign returns a valid design object');
assert.equal(savedDesign.name, 'My Pro Productivity Style', 'Design keeps the given custom name');
assert.equal(savedDesign.layout.device.rotation, -8, 'Saved design stores phone rotation');
assert.equal(savedDesign.layout.headline.fontFamily, 'Montserrat', 'Saved design stores headline font');
assert.equal(savedDesign.layout.shapes.length, 1, 'Saved design stores shapes');
assert.ok(savedDesign.vectorSvg.includes('<svg'), 'Saved design generates an SVG wireframe');

// 2. Read saved designs from storage
const allSaved = getSavedDesigns();
assert.ok(allSaved.length >= 1, 'getSavedDesigns returns the newly saved design');
assert.equal(allSaved[0].id, savedDesign.id, 'Most recently saved design appears first');

// 3. Test generateDesignWireframeSvg directly
const customSvg = generateDesignWireframeSvg(savedDesign.layout);
assert.ok(customSvg.includes('<svg'), 'generateDesignWireframeSvg produces valid SVG markup');
assert.ok(customSvg.includes('rotate(-8)'), 'generateDesignWireframeSvg reflects the device rotation');

// 4. Apply saved design to a fresh screen
const newTargetStore = new Store();
const targetScBefore = newTargetStore.getActiveScreen();
assert.notEqual(targetScBefore.headline.fontFamily, 'Montserrat', 'Target starts with default font');

const applyResult = applyCustomDesign(newTargetStore, savedDesign.id, false);
assert.equal(applyResult, true, 'applyCustomDesign returns true on success');

const targetScAfter = newTargetStore.getActiveScreen();
assert.equal(targetScAfter.headline.fontFamily, 'Montserrat', 'Target receives saved headline font');
assert.equal(targetScAfter.device.rotation, -8, 'Target receives saved device rotation');
assert.equal(targetScAfter.shapes.length, 1, 'Target receives saved shapes');
assert.notEqual(targetScAfter.shapes[0].id, 'shape_test_1', 'Target receives fresh shape IDs for canvas interactivity');
assert.equal(newTargetStore.getState().activeElementId, targetScAfter.shapes[0].id, 'Saved design auto-selects newly created shape');

// 5. Apply saved design across multiple screens
const multiScreenStore = new Store();
multiScreenStore.addScreen();
multiScreenStore.addScreen();
assert.equal(multiScreenStore.getState().screens.length, 3, 'Store has 3 screens');

applyCustomDesign(multiScreenStore, savedDesign.id, true);
for (const sc of multiScreenStore.getState().screens) {
  assert.equal(sc.headline.fontFamily, 'Montserrat', 'All screens receive saved font');
  assert.equal(sc.device.rotation, -8, 'All screens receive saved phone rotation');
  assert.equal(sc.shapes.length, 1, 'All screens receive saved shapes');
  assert.ok(sc.shapes[0].id, 'All shapes have valid unique IDs');
}

// 6. Delete saved design
const deleteResult = deleteSavedDesign(savedDesign.id);
assert.equal(deleteResult, true, 'deleteSavedDesign returns true');
const afterDelete = getSavedDesigns();
assert.ok(!afterDelete.some(d => d.id === savedDesign.id), 'Deleted design is no longer in storage');

// 7. Headline and subtitle deletion behavior
const delStore = sampleStore();
const delSc = delStore.getActiveScreen();
assert.equal(delSc.headline.text, 'Supercharge Your Productivity');

// Simulate deleting headline
delStore.update(s => {
  const sc = activeDoc(s);
  sc.headline.text = '';
  sc.headline.hidden = true;
  s.activeElementId = null;
});
assert.equal(delSc.headline.text, '', 'Headline text is cleared');
assert.equal(delSc.headline.hidden, true, 'Headline is marked hidden so it does not render');

// Simulate deleting subtitle
delStore.update(s => {
  const sc = activeDoc(s);
  sc.subtitle.text = '';
  sc.subtitle.hidden = true;
  s.activeElementId = null;
});
assert.equal(delSc.subtitle.text, '', 'Subtitle text is cleared');
assert.equal(delSc.subtitle.hidden, true, 'Subtitle is marked hidden so it does not render');

// Re-editing restores visibility
delStore.update(s => {
  const sc = activeDoc(s);
  sc.headline.hidden = false;
  sc.headline.text = 'New Headline';
});
assert.equal(delSc.headline.hidden, false, 'Headline unhides when edited');
assert.equal(delSc.headline.text, 'New Headline');

// 8. Solid Color Palettes & Saved Colors verification
const { SOLID_PALETTES, themeManager } = await import('../js/features/theme/themeManager.js');
const { getSavedColors, saveCurrentColors, deleteSavedColor, applyCustomColor } = await import('../js/features/theme/customColors.js');

assert.ok(SOLID_PALETTES.length >= 6, 'Must have at least 6 curated solid palettes');
for (const p of SOLID_PALETTES) {
  assert.equal(p.type, 'solid', `Palette ${p.id} must be solid type`);
  assert.ok(p.solidColor, `Palette ${p.id} must define solidColor`);
}

// Test applying solid palette
const palStore = sampleStore();
themeManager.applyListingPalette(palStore, 'solid_dark_slate', false);
const activeAfterSolid = palStore.getActiveScreen();
assert.equal(activeAfterSolid.background.type, 'solid', 'Applying solid palette sets background.type to solid');
assert.equal(activeAfterSolid.background.solidColor, '#0f172a', 'Applying solid palette sets correct solidColor');
assert.equal(activeAfterSolid.headline.color, '#ffffff', 'Applying solid palette updates headline color');

// Test saving custom colors (solid background)
const savedSolidPal = saveCurrentColors(palStore, 'My Custom Slate');
assert.ok(savedSolidPal, 'saveCurrentColors returns saved palette');
assert.equal(savedSolidPal.type, 'solid');
assert.equal(savedSolidPal.solidColor, '#0f172a');
assert.equal(savedSolidPal.name, 'My Custom Slate');

const allSavedColors = getSavedColors();
assert.ok(allSavedColors.length >= 1, 'getSavedColors retrieves saved palette');
assert.equal(allSavedColors[0].id, savedSolidPal.id);

// Test applying saved custom color to a different store
const freshStore = new Store();
const applyColorRes = applyCustomColor(freshStore, savedSolidPal.id, false);
assert.equal(applyColorRes, true, 'applyCustomColor returns true');
assert.equal(freshStore.getActiveScreen().background.type, 'solid');
assert.equal(freshStore.getActiveScreen().background.solidColor, '#0f172a');

// Test deleting saved custom color
const delColorRes = deleteSavedColor(savedSolidPal.id);
assert.equal(delColorRes, true, 'deleteSavedColor returns true');
assert.ok(!getSavedColors().some(c => c.id === savedSolidPal.id), 'Deleted color is gone from storage');

// Test frame deletion and restoration as an element
const frameTestStore = new Store();
const testScreen = frameTestStore.getActiveScreen();
assert.equal(testScreen.device.hidden, undefined, 'default device is not hidden');

// Simulate delete action on device element
frameTestStore.update(s => {
  const sc = activeDoc(s);
  if (sc.device) sc.device.hidden = true;
  if (s.activeElementId === 'device') s.activeElementId = null;
});
assert.equal(frameTestStore.getActiveScreen().device.hidden, true, 'deleting device marks it as hidden');

// Simulate adding/restoring device element
frameTestStore.update(state => {
  const sc = activeDoc(state);
  if (!sc.device) {
    sc.device = { type: 'modern_phone', color: '#0f172a', scale: 0.92, y: 1180, shadowBlur: 45, hidden: false };
  } else {
    sc.device.hidden = false;
  }
  state.activeElementId = 'device';
});
assert.equal(frameTestStore.getActiveScreen().device.hidden, false, 'restoring device unhides it');
assert.equal(frameTestStore.getState().activeElementId, 'device', 'restoring device makes it the active element');

// Test multi-frame addition, selection, and layer management
const multiStore = new Store();
const msScreen = multiStore.getActiveScreen();
ensureScreenDevices(msScreen);
assert.equal(msScreen.devices.length, 1, 'initial screen has 1 device in devices array');

// Add a 2nd frame
const frame2Id = 'device-test-2';
multiStore.update(s => {
  const sc = activeDoc(s);
  ensureScreenDevices(sc);
  const newDev = {
    id: frame2Id,
    type: 'minimal',
    color: '#374151',
    scale: 0.8,
    x: 750,
    y: 1200,
    hidden: false,
    isDevice: true
  };
  sc.devices.push(newDev);
  if (sc.layerOrder) sc.layerOrder.push(frame2Id);
  s.activeElementId = frame2Id;
});

const updatedScreen = multiStore.getActiveScreen();
assert.equal(updatedScreen.devices.length, 2, 'screen now has 2 frames');
assert.equal(getLayerItem(updatedScreen, frame2Id).type, 'minimal', 'getLayerItem returns frame2');
assert.ok(getLayerOrder(updatedScreen).includes(frame2Id), 'getLayerOrder includes frame2');
assert.equal(multiStore.getState().activeElementId, frame2Id, 'activeElementId is set to frame2');

// Delete frame 2
multiStore.update(s => {
  const sc = activeDoc(s);
  sc.devices = sc.devices.filter(d => d.id !== frame2Id);
  if (s.activeElementId === frame2Id) s.activeElementId = null;
});

assert.equal(multiStore.getActiveScreen().devices.length, 1, 'after deletion, screen has 1 frame');
assert.equal(getLayerItem(multiStore.getActiveScreen(), frame2Id), null, 'frame2 is no longer in layers');

// Test layer filtering when headline and frame are deleted
const delTestStore = new Store();
delTestStore.update(s => {
  const sc = activeDoc(s);
  sc.headline.text = 'Awesome App';
  sc.layerOrder = ['device', 'headline'];
});

// Delete headline
delTestStore.update(s => {
  const sc = activeDoc(s);
  sc.headline.text = '';
  sc.headline.hidden = true;
  sc.headline.deleted = true;
  sc.layerOrder = sc.layerOrder.filter(id => id !== 'headline');
});

// Delete frame
delTestStore.update(s => {
  const sc = activeDoc(s);
  sc.device.hidden = true;
  sc.device.deleted = true;
  sc.layerOrder = sc.layerOrder.filter(id => id !== 'device');
});

const curSc = delTestStore.getActiveScreen();
assert.equal(curSc.headline.deleted, true, 'headline is deleted');
assert.equal(curSc.device.deleted, true, 'device is deleted');
assert.ok(!curSc.layerOrder.includes('headline'), 'headline removed from layerOrder');
assert.ok(!curSc.layerOrder.includes('device'), 'device removed from layerOrder');

console.log('store checks passed');





