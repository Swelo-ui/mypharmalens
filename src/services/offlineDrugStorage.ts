/**
 * Offline Drug Storage Service
 * 
 * Professional IndexedDB-based service for persistent offline drug storage.
 * Features:
 * - Efficient batch storage with chunking for large datasets
 * - Version tracking for smart updates
 * - Storage size calculation
 * - Robust error handling
 */

const DB_NAME = 'pharmalens-offline';
const DB_VERSION = 1;
const DRUGS_STORE = 'drugs';
const METADATA_STORE = 'metadata';

export interface OfflineMetadata {
    version: string;
    lastUpdated: string;
    drugCount: number;
    sizeBytes: number;
}

export interface DrugOfflineData {
    id: string;
    name: string;
    genericName?: string;
    category?: string;
    brandNames?: string[];
    description?: string;
    dosageForm?: string;
    indications?: string[];
    sideEffects?: string[];
    contraindications?: string[];
    interactions?: string[];
    warnings?: string[];
    mechanism?: string;
    pharmacokinetics?: string;
    storage?: string;
    [key: string]: unknown;
}

/**
 * Open IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open offline database:', request.error);
            reject(new Error('Failed to open offline database'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create drugs store with id as key
            if (!db.objectStoreNames.contains(DRUGS_STORE)) {
                const drugsStore = db.createObjectStore(DRUGS_STORE, { keyPath: 'id' });
                drugsStore.createIndex('name', 'name', { unique: false });
                drugsStore.createIndex('category', 'category', { unique: false });
            }

            // Create metadata store
            if (!db.objectStoreNames.contains(METADATA_STORE)) {
                db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
            }
        };
    });
}

/**
 * Save all drugs to offline storage with progress callback
 */
export async function saveDrugsToOffline(
    drugs: DrugOfflineData[],
    version: string,
    onProgress?: (progress: number) => void
): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DRUGS_STORE, METADATA_STORE], 'readwrite');
        const drugsStore = transaction.objectStore(DRUGS_STORE);
        const metadataStore = transaction.objectStore(METADATA_STORE);

        // Clear existing drugs first
        const clearRequest = drugsStore.clear();

        clearRequest.onsuccess = () => {
            const total = drugs.length;
            let completed = 0;

            // Add drugs in batches for better performance
            const BATCH_SIZE = 50;

            const processBatch = (startIndex: number) => {
                const endIndex = Math.min(startIndex + BATCH_SIZE, total);

                for (let i = startIndex; i < endIndex; i++) {
                    const drug = drugs[i];
                    const request = drugsStore.put(drug);

                    request.onsuccess = () => {
                        completed++;
                        if (onProgress) {
                            onProgress(Math.round((completed / total) * 100));
                        }
                    };

                    request.onerror = () => {
                        console.error('Failed to save drug:', drug.id, request.error);
                    };
                }

                // Process next batch
                if (endIndex < total) {
                    setTimeout(() => processBatch(endIndex), 0);
                }
            };

            processBatch(0);
        };

        transaction.oncomplete = async () => {
            // Save metadata
            const sizeBytes = new Blob([JSON.stringify(drugs)]).size;

            const metaTransaction = db.transaction(METADATA_STORE, 'readwrite');
            const metaStore = metaTransaction.objectStore(METADATA_STORE);

            metaStore.put({
                key: 'offline_data',
                version,
                lastUpdated: new Date().toISOString(),
                drugCount: drugs.length,
                sizeBytes
            });

            metaTransaction.oncomplete = () => {
                db.close();
                resolve();
            };

            metaTransaction.onerror = () => {
                db.close();
                reject(new Error('Failed to save metadata'));
            };
        };

        transaction.onerror = () => {
            db.close();
            reject(new Error('Failed to save drugs to offline storage'));
        };
    });
}

/**
 * Get all drugs from offline storage
 */
export async function getDrugsFromOffline(): Promise<DrugOfflineData[]> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(DRUGS_STORE, 'readonly');
            const store = transaction.objectStore(DRUGS_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                db.close();
                resolve(request.result || []);
            };

            request.onerror = () => {
                db.close();
                reject(new Error('Failed to get offline drugs'));
            };
        });
    } catch (error) {
        console.error('Error getting offline drugs:', error);
        return [];
    }
}

/**
 * Get offline storage metadata
 */
export async function getOfflineMetadata(): Promise<OfflineMetadata | null> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(METADATA_STORE, 'readonly');
            const store = transaction.objectStore(METADATA_STORE);
            const request = store.get('offline_data');

            request.onsuccess = () => {
                db.close();
                const result = request.result;
                if (result) {
                    resolve({
                        version: result.version,
                        lastUpdated: result.lastUpdated,
                        drugCount: result.drugCount,
                        sizeBytes: result.sizeBytes
                    });
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                db.close();
                reject(new Error('Failed to get metadata'));
            };
        });
    } catch (error) {
        console.error('Error getting offline metadata:', error);
        return null;
    }
}

/**
 * Check if offline data is available
 */
export async function isOfflineDataAvailable(): Promise<boolean> {
    const metadata = await getOfflineMetadata();
    return metadata !== null && metadata.drugCount > 0;
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DRUGS_STORE, METADATA_STORE], 'readwrite');

            transaction.objectStore(DRUGS_STORE).clear();
            transaction.objectStore(METADATA_STORE).clear();

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };

            transaction.onerror = () => {
                db.close();
                reject(new Error('Failed to clear offline data'));
            };
        });
    } catch (error) {
        console.error('Error clearing offline data:', error);
        throw error;
    }
}

/**
 * Search drugs in offline storage
 */
export async function searchOfflineDrugs(query: string): Promise<DrugOfflineData[]> {
    const drugs = await getDrugsFromOffline();

    // If no query, return all drugs
    if (!query || query.trim() === '') {
        return drugs;
    }

    const lowerQuery = query.toLowerCase().trim();

    return drugs.filter(drug =>
        drug.name?.toLowerCase().includes(lowerQuery) ||
        drug.genericName?.toLowerCase().includes(lowerQuery) ||
        drug.brandNames?.some(brand => brand.toLowerCase().includes(lowerQuery)) ||
        drug.category?.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get a single drug from offline storage
 */
export async function getOfflineDrugById(id: string): Promise<DrugOfflineData | null> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(DRUGS_STORE, 'readonly');
            const store = transaction.objectStore(DRUGS_STORE);
            const request = store.get(id);

            request.onsuccess = () => {
                db.close();
                resolve(request.result || null);
            };

            request.onerror = () => {
                db.close();
                reject(new Error('Failed to get drug'));
            };
        });
    } catch (error) {
        console.error('Error getting offline drug:', error);
        return null;
    }
}

/**
 * Format bytes to human readable size
 */
export function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
