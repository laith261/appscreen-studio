/**
 * App Screen Generator - Persistence & State Auto-Save Manager
 * Handles seamless, instant state restoration across browser refreshes and sessions.
 * Pure client-side zero-backend storage combining synchronous localStorage for instant startup
 * and IndexedDB for large media assets and multi-project persistence.
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
 * Saves project data and optional thumbnail to IndexedDB.
 * @param {string} id
 * @param {Object} projectData
 * @param {string|null} [thumbnail]
 * @returns {Promise<boolean>}
 */
export async function idbSaveProject(id, projectData, thumbnail = null) {
  if (!id || !projectData) return false;
  try {
    const db = await getIndexedDb();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);

      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        const finalThumbnail = thumbnail !== null && thumbnail !== undefined
          ? thumbnail
          : (existing?.thumbnail || null);

        const record = {
          id,
          project: projectData,
          name: projectData.projectName || 'Untitled',
          screens: Array.isArray(projectData.screens) ? projectData.screens.length : 0,
          languages: projectData.languages || ['en'],
          updatedAt: Date.now(),
          thumbnail: finalThumbnail
        };

        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => resolve(false);
      };

      getReq.onerror = () => {
        const record = {
          id,
          project: projectData,
          name: projectData.projectName || 'Untitled',
          screens: Array.isArray(projectData.screens) ? projectData.screens.length : 0,
          languages: projectData.languages || ['en'],
          updatedAt: Date.now(),
          thumbnail: thumbnail || null
        };
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => resolve(false);
      };
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
    return false;
  }
}

/**
 * Loads project data from IndexedDB, falling back to localStorage.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function idbGetProject(id) {
  if (!id) return null;
  try {
    const db = await getIndexedDb();
    if (db) {
      const record = await new Promise((resolve) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (record?.project) return record.project;
    }
  } catch (err) {
    console.warn('Failed to read from IndexedDB:', err);
  }
  return getLocalProject(id);
}

/**
 * Retrieves all stored projects metadata sorted by recent update timestamp.
 * Scans both IndexedDB and localStorage for maximum reliability.
 * @returns {Promise<Array<{id: string, name: string, screens: number, languages: string[], updated: number, thumbnail: string|null}>>}
 */
export async function idbListProjects() {
  const projectsMap = new Map();

  // 1. Read from IndexedDB
  try {
    const db = await getIndexedDb();
    if (db) {
      const records = await new Promise((resolve) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      for (const rec of records) {
        if (!rec || !rec.id) continue;
        const project = rec.project || {};
        projectsMap.set(rec.id, {
          id: rec.id,
          name: rec.name || project.projectName || 'Untitled',
          screens: rec.screens ?? (Array.isArray(project.screens) ? project.screens.length : 0),
          languages: rec.languages || project.languages || ['en'],
          updated: rec.updatedAt ? Math.floor(rec.updatedAt / 1000) : Math.floor(Date.now() / 1000),
          thumbnail: rec.thumbnail || null
        });
      }
    }
  } catch (err) {
    console.warn('Failed to list projects from IndexedDB:', err);
  }

  // 2. Scan localStorage for any unindexed projects
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(KEY_PROJECT_PREFIX)) {
          const id = key.substring(KEY_PROJECT_PREFIX.length);
          if (!projectsMap.has(id)) {
            try {
              const project = JSON.parse(localStorage.getItem(key));
              if (project && typeof project === 'object') {
                projectsMap.set(id, {
                  id,
                  name: project.projectName || 'Untitled',
                  screens: Array.isArray(project.screens) ? project.screens.length : 0,
                  languages: project.languages || ['en'],
                  updated: Math.floor(Date.now() / 1000),
                  thumbnail: null
                });
              }
            } catch (_) {}
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to read projects from localStorage:', err);
  }

  const list = Array.from(projectsMap.values());
  list.sort((a, b) => (b.updated || 0) - (a.updated || 0));
  return list;
}

/**
 * Permanently deletes a project from both IndexedDB and localStorage.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function idbDeleteProject(id) {
  if (!id) return false;

  try {
    const db = await getIndexedDb();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  } catch (err) {
    console.warn('Failed to delete from IndexedDB:', err);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${KEY_PROJECT_PREFIX}${id}`);
      if (localStorage.getItem(KEY_LAST_PROJECT_ID) === id) {
        localStorage.removeItem(KEY_LAST_PROJECT_ID);
        localStorage.removeItem(KEY_CURRENT_PROJECT);
      }
      const cur = localStorage.getItem(KEY_CURRENT_PROJECT);
      if (cur) {
        try {
          const parsed = JSON.parse(cur);
          if (parsed && (parsed.id === id || parsed.projectId === id)) {
            localStorage.removeItem(KEY_CURRENT_PROJECT);
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('Failed to delete from localStorage:', err);
  }

  return true;
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
    } else {
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
