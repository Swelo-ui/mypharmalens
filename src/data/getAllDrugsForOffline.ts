/**
 * Get All Drugs For Offline Storage
 * 
 * Provides access to combined drug data and version tracking
 * for offline storage feature.
 */

import { combinedDrugsData } from './combinedDrugsData';
import { DrugData } from '@/components/DrugCard';

// Current data version - update this when drug data changes significantly
// This is auto-calculated but can be overridden for force updates
export const DRUG_DATA_VERSION = generateDataVersion();

/**
 * Generate a unique version string based on drug data
 */
function generateDataVersion(): string {
    const count = combinedDrugsData.length;
    const firstId = combinedDrugsData[0]?.id || 'none';
    const lastId = combinedDrugsData[count - 1]?.id || 'none';

    // Create a simple hash from the data
    const dataString = `${count}-${firstId}-${lastId}`;
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return `v${count}-${Math.abs(hash).toString(36)}`;
}

/**
 * Get all drugs for offline storage
 * Returns the full combined drugs data array
 */
export function getAllDrugsForOffline(): DrugData[] {
    return combinedDrugsData;
}

/**
 * Get current drug data version string
 */
export function getDrugDataVersion(): string {
    return DRUG_DATA_VERSION;
}

/**
 * Get total drug count
 */
export function getTotalDrugCount(): number {
    return combinedDrugsData.length;
}

/**
 * Estimate the size of drug data in bytes
 */
export function estimateDrugDataSize(): number {
    return new Blob([JSON.stringify(combinedDrugsData)]).size;
}
