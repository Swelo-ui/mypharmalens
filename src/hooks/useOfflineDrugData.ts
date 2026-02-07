/**
 * useOfflineDrugData Hook
 * 
 * Professional React hook for managing offline drug data.
 * Features:
 * - Download progress tracking
 * - Auto-update detection
 * - Storage status monitoring
 * - Smooth user experience
 */

import { useState, useEffect, useCallback } from 'react';
import {
    saveDrugsToOffline,
    getDrugsFromOffline,
    getOfflineMetadata,
    clearOfflineData,
    isOfflineDataAvailable,
    formatStorageSize,
    getActualStorageSize,
    OfflineMetadata,
    DrugOfflineData
} from '@/services/offlineDrugStorage';
import {
    getAllDrugsForOffline,
    getDrugDataVersion,
    estimateDrugDataSize,
    getTotalDrugCount
} from '@/data/getAllDrugsForOffline';
import { toast } from 'sonner';

export interface OfflineStatus {
    available: boolean;
    version: string | null;
    lastUpdated: string | null;
    drugCount: number;
    sizeBytes: number;
    formattedSize: string;
    actualIndexedDBSize: number;
    formattedActualSize: string;
    isLoading: boolean;
}

export interface UseOfflineDrugDataReturn {
    // Status
    offlineStatus: OfflineStatus;
    isDownloading: boolean;
    downloadProgress: number;
    hasUpdates: boolean;
    estimatedSize: string;

    // Actions
    downloadOfflineData: () => Promise<void>;
    deleteOfflineData: () => Promise<void>;
    checkForUpdates: () => Promise<boolean>;
    refreshStatus: () => Promise<void>;

    // Data access
    getOfflineDrugs: () => Promise<DrugOfflineData[]>;
}

const STORAGE_KEY = 'pharmalens_offline_enabled';

export function useOfflineDrugData(): UseOfflineDrugDataReturn {
    const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
        available: false,
        version: null,
        lastUpdated: null,
        drugCount: 0,
        sizeBytes: 0,
        formattedSize: '0 B',
        actualIndexedDBSize: 0,
        formattedActualSize: '0 B',
        isLoading: true
    });

    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [hasUpdates, setHasUpdates] = useState(false);
    const [estimatedSize, setEstimatedSize] = useState('');

    // Refresh offline status
    const refreshStatus = useCallback(async () => {
        try {
            setOfflineStatus(prev => ({ ...prev, isLoading: true }));

            const metadata = await getOfflineMetadata();
            const available = await isOfflineDataAvailable();

            // Get actual storage size from browser
            const actualStorage = await getActualStorageSize();
            const actualSize = actualStorage?.indexedDBSize || 0;

            if (metadata && available) {
                setOfflineStatus({
                    available: true,
                    version: metadata.version,
                    lastUpdated: metadata.lastUpdated,
                    drugCount: metadata.drugCount,
                    sizeBytes: metadata.sizeBytes,
                    formattedSize: formatStorageSize(metadata.sizeBytes),
                    actualIndexedDBSize: actualSize,
                    formattedActualSize: formatStorageSize(actualSize),
                    isLoading: false
                });

                // Check for updates
                const currentVersion = getDrugDataVersion();
                setHasUpdates(metadata.version !== currentVersion);
            } else {
                setOfflineStatus({
                    available: false,
                    version: null,
                    lastUpdated: null,
                    drugCount: 0,
                    sizeBytes: 0,
                    formattedSize: '0 B',
                    actualIndexedDBSize: 0,
                    formattedActualSize: '0 B',
                    isLoading: false
                });
                setHasUpdates(false);
            }
        } catch (error) {
            console.error('Error refreshing offline status:', error);
            setOfflineStatus(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    // Load initial status
    useEffect(() => {
        refreshStatus();

        const size = estimateDrugDataSize();
        setEstimatedSize(formatStorageSize(size));
    }, [refreshStatus]);

    // Download all drugs for offline use with visible staged progress
    const downloadOfflineData = useCallback(async () => {
        try {
            setIsDownloading(true);
            setDownloadProgress(0);

            // Phase 1: Preparing (0-15%)
            toast.loading('Preparing drug database...', {
                id: 'offline-download'
            });
            setDownloadProgress(5);
            await new Promise(resolve => setTimeout(resolve, 300));
            setDownloadProgress(10);
            await new Promise(resolve => setTimeout(resolve, 200));
            setDownloadProgress(15);

            // Get all drugs
            const drugs = getAllDrugsForOffline();
            const version = getDrugDataVersion();

            // Phase 2: Loading data (15-35%)
            toast.loading(`Loading ${drugs.length.toLocaleString()} medicines...`, {
                id: 'offline-download'
            });
            setDownloadProgress(20);
            await new Promise(resolve => setTimeout(resolve, 300));
            setDownloadProgress(30);
            await new Promise(resolve => setTimeout(resolve, 200));
            setDownloadProgress(35);

            // Phase 3: Saving to IndexedDB (35-95%)
            toast.loading(`Saving ${drugs.length.toLocaleString()} medicines to device...`, {
                id: 'offline-download'
            });

            // Save to IndexedDB with progress mapped to 35-95%
            await saveDrugsToOffline(
                drugs as DrugOfflineData[],
                version,
                (progress) => {
                    // Map 0-100 progress to 35-95 range
                    const mappedProgress = 35 + Math.round(progress * 0.6);
                    setDownloadProgress(mappedProgress);
                }
            );

            // Phase 4: Finalizing (95-100%)
            toast.loading('Finalizing...', {
                id: 'offline-download'
            });
            setDownloadProgress(96);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Mark as enabled in localStorage
            localStorage.setItem(STORAGE_KEY, 'true');
            setDownloadProgress(98);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Refresh status
            await refreshStatus();
            setDownloadProgress(100);
            await new Promise(resolve => setTimeout(resolve, 300));

            // Success toast
            toast.success(`Downloaded ${drugs.length.toLocaleString()} medicines!`, {
                id: 'offline-download',
                description: 'You can now use the app without internet'
            });

        } catch (error) {
            console.error('Error downloading offline data:', error);
            toast.error('Failed to download offline data', {
                id: 'offline-download',
                description: 'Please try again'
            });
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    }, [refreshStatus]);

    // Delete offline data
    const deleteOfflineData = useCallback(async () => {
        try {
            toast.loading('Removing offline data...', { id: 'offline-delete' });

            await clearOfflineData();
            localStorage.removeItem(STORAGE_KEY);

            await refreshStatus();

            toast.success('Offline data removed', {
                id: 'offline-delete',
                description: 'Storage has been freed'
            });
        } catch (error) {
            console.error('Error deleting offline data:', error);
            toast.error('Failed to remove offline data', { id: 'offline-delete' });
        }
    }, [refreshStatus]);

    // Check for updates with visual feedback
    const checkForUpdates = useCallback(async (): Promise<boolean> => {
        try {
            // Show checking toast
            toast.loading('Checking for updates...', { id: 'update-check' });

            const metadata = await getOfflineMetadata();
            if (!metadata) {
                toast.info('No offline data found', {
                    id: 'update-check',
                    description: 'Download data first to enable offline mode'
                });
                return false;
            }

            // Simulate network check delay for better UX (1-2 seconds)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const currentVersion = getDrugDataVersion();
            const currentDrugCount = getAllDrugsForOffline().length;
            const hasNew = metadata.version !== currentVersion || metadata.drugCount !== currentDrugCount;

            setHasUpdates(hasNew);

            if (hasNew) {
                const newDrugs = currentDrugCount - metadata.drugCount;
                toast.success('Update available!', {
                    id: 'update-check',
                    description: newDrugs > 0
                        ? `${newDrugs} new medicines added since your last download`
                        : 'Data has been updated since your last download'
                });
            } else {
                toast.success('Data is up to date!', {
                    id: 'update-check',
                    description: `You have the latest version with ${metadata.drugCount.toLocaleString()} medicines`
                });
            }

            return hasNew;
        } catch (error) {
            console.error('Error checking for updates:', error);
            toast.error('Failed to check for updates', {
                id: 'update-check',
                description: 'Please try again later'
            });
            return false;
        }
    }, []);

    // Get offline drugs
    const getOfflineDrugs = useCallback(async (): Promise<DrugOfflineData[]> => {
        return getDrugsFromOffline();
    }, []);

    return {
        offlineStatus,
        isDownloading,
        downloadProgress,
        hasUpdates,
        estimatedSize,
        downloadOfflineData,
        deleteOfflineData,
        checkForUpdates,
        refreshStatus,
        getOfflineDrugs
    };
}

export default useOfflineDrugData;
