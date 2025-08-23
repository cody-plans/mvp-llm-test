/**
 * Runtime loader for data stored in IndexedDB
 * 
 * Provides clean APIs for the main application to load active data
 * and build prompt blocks without hard-coded data.
 */

const DB_NAME = 'data-store';
const STORE_NAME = 'taxonomy';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB connection
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Load the active data for a specific group
 * @param group Group identifier (default: "Default")
 * @returns Promise resolving to the active data or null if not found
 */
export async function loadActiveTaxonomy(group = "Default") {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    // Get the active pointer
    const activeKey = `taxonomy:${group}:active`;
    const activePointer = await new Promise((resolve, reject) => {
      const request = store.get(activeKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!activePointer || !activePointer.ref) {
      console.warn(`No active data found for group: ${group}`);
      return null;
    }
    
    // Get the full data
    const dataRecord = await new Promise((resolve, reject) => {
      const request = store.get(activePointer.ref);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!dataRecord || !dataRecord.data) {
      console.warn(`Data not found for reference: ${activePointer.ref}`);
      return null;
    }
    
    console.log(`✅ Loaded data for ${group}: v${dataRecord.data.version} (${dataRecord.data.categories.length} categories)`);
    return dataRecord.data;
    
  } catch (error) {
    console.error(`❌ Failed to load data for ${group}:`, error);
    return null;
  }
}

/**
 * Build a minimal prompt block using subcategory IDs only
 * @param group Group identifier (default: "Default")
 * @returns Promise resolving to formatted prompt text
 */
export async function buildPromptBlock(group = "Default") {
  try {
    const data = await loadActiveTaxonomy(group);
    
    if (!data) {
      return `No data found for group: ${group}`;
    }
    
    const promptLines = data.categories.map(category => {
      const subcategoryIds = category.children.map(sub => sub.id);
      return `- ${category.label}: [${subcategoryIds.join(', ')}]`;
    });
    
    return promptLines.join('\n');
    
  } catch (error) {
    console.error(`❌ Failed to build prompt block for ${group}:`, error);
    return `Error building prompt block for ${group}`;
  }
}

/**
 * Get all available group identifiers
 * @returns Promise resolving to array of group strings
 */
export async function getAvailableGroups() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const groups = new Set();
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const key = cursor.key;
          if (key.startsWith('taxonomy:') && key.endsWith(':active')) {
            const group = key.split(':')[1];
            groups.add(group);
          }
          cursor.continue();
        } else {
          resolve(Array.from(groups).sort());
        }
      };
      
      request.onerror = () => reject(request.error);
    });
    
  } catch (error) {
    console.error('❌ Failed to get available groups:', error);
    return [];
  }
}

/**
 * Get data metadata for a specific group
 * @param group Group identifier
 * @returns Promise resolving to data metadata or null
 */
export async function getTaxonomyMetadata(group) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    // Get the active pointer
    const activeKey = `taxonomy:${group}:active`;
    const activePointer = await new Promise((resolve, reject) => {
      const request = store.get(activeKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!activePointer || !activePointer.ref) {
      return null;
    }
    
    // Get the full data record
    const dataRecord = await new Promise((resolve, reject) => {
      const request = store.get(activePointer.ref);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!dataRecord) {
      return null;
    }
    
    return {
      version: dataRecord.version,
      timestamp: dataRecord.timestamp
    };
    
  } catch (error) {
    console.error(`❌ Failed to get data metadata for ${group}:`, error);
    return null;
  }
}
