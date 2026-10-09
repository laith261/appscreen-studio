// Run: node tests/persistence.check.mjs — checks local storage & IndexedDB persistence and project management
import assert from 'node:assert/strict';

// Mock localStorage for Node environment
const mem = {};
globalThis.localStorage = {
  getItem: (k) => mem[k] ?? null,
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
  clear: () => { for (const k in mem) delete mem[k]; },
  key: (i) => Object.keys(mem)[i] ?? null,
  get length() { return Object.keys(mem).length; }
};

import {
  getLastProjectId,
  setLastProjectId,
  getLocalProject,
  saveLocalProject,
  getUiState,
  saveUiState,
  idbListProjects,
  idbDeleteProject,
  idbGetProject
} from '../js/features/storage/persistenceManager.js';

// 1. Last project ID tracking
assert.equal(getLastProjectId(), null, 'initially null');
setLastProjectId('proj-123');
assert.equal(getLastProjectId(), 'proj-123', 'stores and retrieves last project id');

// 2. Project state saving & loading
const sampleState = {
  projectName: 'Test App',
  activeScreenId: 'screen-2',
  languages: ['en', 'es'],
  screens: [
    { id: 'screen-1', name: 'Screen 1', headline: { text: 'Hello' } },
    { id: 'screen-2', name: 'Screen 2', headline: { text: 'World' } }
  ]
};

const saved = saveLocalProject('proj-123', sampleState);
assert.equal(saved, true, 'project saved successfully');

const loaded = getLocalProject('proj-123');
assert.deepEqual(loaded.projectName, 'Test App', 'loaded project matches name');
assert.deepEqual(loaded.activeScreenId, 'screen-2', 'loaded project matches active screen');
assert.equal(loaded.screens.length, 2, 'loaded project has all screens');

// 3. UI State saving & loading
const defaultUi = getUiState();
assert.equal(defaultUi.activeTab, 'templates', 'default UI tab is templates');
assert.equal(defaultUi.isDrawerOpen, true, 'default drawer is open');

saveUiState({
  activeTab: 'themes',
  isDrawerOpen: false,
  zoom: 1.15,
  scrollTop: 240
});

const updatedUi = getUiState();
assert.equal(updatedUi.activeTab, 'themes', 'restores active tab');
assert.equal(updatedUi.isDrawerOpen, false, 'restores drawer collapse state');
assert.equal(updatedUi.zoom, 1.15, 'restores zoom level');
assert.equal(updatedUi.scrollTop, 240, 'restores scroll position');

// 4. Serverless project listing & retrieval
const list = await idbListProjects();
assert.ok(Array.isArray(list), 'idbListProjects returns an array');
assert.equal(list.length, 1, 'lists 1 saved project');
assert.equal(list[0].id, 'proj-123', 'listed project id matches');
assert.equal(list[0].name, 'Test App', 'listed project name matches');
assert.equal(list[0].screens, 2, 'listed screen count matches');
assert.deepEqual(list[0].languages, ['en', 'es'], 'listed languages match');

const fetched = await idbGetProject('proj-123');
assert.ok(fetched, 'idbGetProject returns project object');
assert.equal(fetched.projectName, 'Test App', 'fetched project name matches');

// 5. Serverless project deletion
await idbDeleteProject('proj-123');
const afterDeleteList = await idbListProjects();
assert.equal(afterDeleteList.length, 0, 'project list is empty after deletion');
assert.equal(getLocalProject('proj-123'), null, 'project cache is cleared after deletion');

console.log('persistence and serverless storage checks passed');
