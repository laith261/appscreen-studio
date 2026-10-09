/**
 * App Screen Generator - Persistence & State Auto-Save Manager
 * Handles seamless, instant state restoration across browser refreshes and sessions.
 * Combines synchronous localStorage for instant layout restoration,
 * IndexedDB for large media assets, and backend server sync.
 */

const KEY_LAST_PROJECT_ID = 'appscreen_last_project_id';
const KEY_PROJECT_PREFIX = 'appscreen_project_';
const KEY_CURRENT_PROJECT = 'appscreen_current_project';
const KEY_UI_STATE = 'appscreen_ui_state';

const DB_NAME = 'appscreen_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

let idbPromise = null;

/**
 * Initializes and returns a singleton connection to IndexedDB.
 * @returns {Promise<IDBDatabase|null>}
 */
function getIndexedDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!idbPromise) {
    idbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
            db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = (err) => {
          console.warn('IndexedDB unavailable, using localStorage only:', err);
          resolve(null);
        };
      } catch (err) {
        console.warn('Failed to open IndexedDB:', err);
        resolve(null);
      }
    });
  }
  return idbPromise;
}

/**
 * Saves project data to IndexedDB.
 * @param {string} id
 * @param {Object} projectData
 */
async function idbSaveProject(id, projectData) {
  try {
    const db = await getIndexedDb();
    if (!db) return;
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    store.put({ id, project: projectData, updatedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
  }
}

/**
 * Loads project data from IndexedDB.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function idbGetProject(id) {
  try {
    const db = await getIndexedDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.project || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to read from IndexedDB:', err);
    return null;
  }
}

/**
 * Gets the last worked-on project ID from localStorage.
 * @returns {string|null}
 */
export function getLastProjectId() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(KEY_LAST_PROJECT_ID) || null;
  } catch (err) {
    console.error('Failed to read last project ID:', err);
    return null;
  }
}

/**
 * Sets the last worked-on project ID in localStorage.
 * @param {string} id
 */
export function setLastProjectId(id) {
  try {
    if (typeof localStorage === 'undefined' || !id) return;
    localStorage.setItem(KEY_LAST_PROJECT_ID, id);
  } catch (err) {
    console.error('Failed to store last project ID:', err);
  }
}

/**
 * Synchronously reads a project from localStorage.
 * @param {string} [id]
 * @returns {Object|null}
 */
export function getLocalProject(id) {
  try {
    if (typeof localStorage === 'undefined') return null;
    let raw = null;
    if (id) {
      raw = localStorage.getItem(`${KEY_PROJECT_PREFIX}${id}`);
    }
    if (!raw) {
      raw = localStorage.getItem(KEY_CURRENT_PROJECT);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    console.error('Failed to read local project from localStorage:', err);
    return null;
  }
}

/**
 * Synchronously saves the active project state into localStorage,
 * and asynchronously backs it up to IndexedDB.
 * @param {string} id Project ID
 * @param {Object} projectState Current project state from appStore.getState()
 * @returns {boolean} Success status
 */
export function saveLocalProject(id, projectState) {
  if (typeof localStorage === 'undefined' || !projectState) return false;

  try {
    setLastProjectId(id);

    const payload = JSON.stringify(projectState);
    if (id) {
      localStorage.setItem(`${KEY_PROJECT_PREFIX}${id}`, payload);
    }
    localStorage.setItem(KEY_CURRENT_PROJECT, payload);

    // Asynchronously backup to IndexedDB for safety with large assets
    idbSaveProject(id, projectState);
    return true;
  } catch (err) {
    console.warn('localStorage quota warning when saving project state:', err);

    // If quota exceeded due to large images, save to IndexedDB as primary
    idbSaveProject(id, projectState);

    // And try saving a trimmed version to localStorage for instant startup
    try {
      const stripped = JSON.parse(JSON.stringify(projectState));
      // Truncate excessively large data URLs if needed to keep fast synchronous restoration
      if (Array.isArray(stripped.screens)) {
        stripped.screens.forEach(sc => {
          if (sc.device?.image?.length > 100000) delete sc.device.image;
        });
      }
      localStorage.setItem(KEY_CURRENT_PROJECT, JSON.stringify(stripped));
    } catch (fallbackErr) {
      console.error('Could not save fallback project in localStorage:', fallbackErr);
    }
    return false;
  }
}

/**
 * Saves UI view preferences (active drawer tab, collapse state, zoom, scroll position).
 * @param {Object} uiState
 */
export function saveUiState(uiState) {
  try {
    if (typeof localStorage === 'undefined' || !uiState) return;
    const prev = getUiState();
    const merged = { ...prev, ...uiState, updatedAt: Date.now() };
    localStorage.setItem(KEY_UI_STATE, JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to save UI state to localStorage:', err);
  }
}

/**
 * Retrieves saved UI view preferences.
 * @returns {Object}
 */
export function getUiState() {
  const defaults = {
    activeTab: 'templates',
    isDrawerOpen: true,
    themeFilter: 'all',
    zoom: 0.85,
    scrollTop: 0,
    scrollLeft: 0
  };

  try {
    if (typeof localStorage === 'undefined') return defaults;
    const raw = localStorage.getItem(KEY_UI_STATE);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch (err) {
    console.error('Failed to read UI state from localStorage:', err);
    return defaults;
  }
}
