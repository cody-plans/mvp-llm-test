/**
 * Runtime loader for taxonomy data stored in IndexedDB
 * 
 * Provides clean APIs for the main application to load active taxonomy
 * and build prompt blocks without hard-coded data.
 */

export interface TaxonomySubcategory {
  id: string;
  label: string;
  order: number;
  hint?: string;
  def?: string;
  keywords: string[];
}

export interface TaxonomyCategory {
  id: string;
  label: string;
  order: number;
  children: TaxonomySubcategory[];
}

export interface Taxonomy {
  version: string;
  categories: TaxonomyCategory[];
}

export interface TaxonomyPointer {
  id: string;
  lob: string;
  ref: string;
  timestamp: number;
}

export interface TaxonomyRecord {
  id: string;
  lob: string;
  version: string;
  data: Taxonomy;
  timestamp: number;
}

const DB_NAME = 'td-classifier';
const STORE_NAME = 'taxonomy';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB connection
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Load the active taxonomy for a specific line of business
 * @param lob Line of business identifier (default: "Retail")
 * @returns Promise resolving to the active taxonomy or null if not found
 */
export async function loadActiveTaxonomy(lob: string = "Retail"): Promise<Taxonomy | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    // Get the active pointer
    const activeKey = `taxonomy:${lob}:active`;
    const activePointer = await store.get(activeKey) as TaxonomyPointer | undefined;
    
    if (!activePointer || !activePointer.ref) {
      console.warn(`No active taxonomy found for LOB: ${lob}`);
      return null;
    }
    
    // Get the full taxonomy data
    const taxonomyRecord = await store.get(activePointer.ref) as TaxonomyRecord | undefined;
    
    if (!taxonomyRecord || !taxonomyRecord.data) {
      console.warn(`Taxonomy data not found for reference: ${activePointer.ref}`);
      return null;
    }
    
    console.log(`✅ Loaded taxonomy for ${lob}: v${taxonomyRecord.data.version} (${taxonomyRecord.data.categories.length} categories)`);
    return taxonomyRecord.data;
    
  } catch (error) {
    console.error(`❌ Failed to load taxonomy for ${lob}:`, error);
    return null;
  }
}

/**
 * Build a minimal prompt block using subcategory IDs only
 * @param lob Line of business identifier (default: "Retail")
 * @returns Promise resolving to formatted prompt text
 */
export async function buildPromptBlock(lob: string = "Retail"): Promise<string> {
  try {
    const taxonomy = await loadActiveTaxonomy(lob);
    
    if (!taxonomy) {
      return `No taxonomy found for LOB: ${lob}`;
    }
    
    const promptLines = taxonomy.categories.map(category => {
      const subcategoryIds = category.children.map(sub => sub.id);
      return `- ${category.label}: [${subcategoryIds.join(', ')}]`;
    });
    
    return promptLines.join('\n');
    
  } catch (error) {
    console.error(`❌ Failed to build prompt block for ${lob}:`, error);
    return `Error building prompt block for ${lob}`;
  }
}

/**
 * Get all available line of business identifiers
 * @returns Promise resolving to array of LOB strings
 */
export async function getAvailableLOBs(): Promise<string[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const lobs = new Set<string>();
    const cursor = store.openCursor();
    
    return new Promise((resolve, reject) => {
      cursor.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const key = cursor.key as string;
          if (key.startsWith('taxonomy:') && key.endsWith(':active')) {
            const lob = key.split(':')[1];
            lobs.add(lob);
          }
          cursor.continue();
        } else {
          resolve(Array.from(lobs).sort());
        }
      };
      
      cursor.onerror = () => reject(cursor.error);
    });
    
  } catch (error) {
    console.error('❌ Failed to get available LOBs:', error);
    return [];
  }
}

/**
 * Get taxonomy metadata for a specific LOB
 * @param lob Line of business identifier
 * @returns Promise resolving to taxonomy metadata or null
 */
export async function getTaxonomyMetadata(lob: string): Promise<{ version: string; timestamp: number } | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    // Get the active pointer
    const activeKey = `taxonomy:${lob}:active`;
    const activePointer = await store.get(activeKey) as TaxonomyPointer | undefined;
    
    if (!activePointer || !activePointer.ref) {
      return null;
    }
    
    // Get the full taxonomy record
    const taxonomyRecord = await store.get(activePointer.ref) as TaxonomyRecord | undefined;
    
    if (!taxonomyRecord) {
      return null;
    }
    
    return {
      version: taxonomyRecord.version,
      timestamp: taxonomyRecord.timestamp
    };
    
  } catch (error) {
    console.error(`❌ Failed to get taxonomy metadata for ${lob}:`, error);
    return null;
  }
}
