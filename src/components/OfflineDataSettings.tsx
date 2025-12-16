/**
 * Offline Data Settings Component
 * 
 * Professional UI for managing offline drug data download.
 * Features:
 * - Download progress with animated progress bar
 * - Storage usage display
 * - Update detection and one-click update
 * - Clean delete functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    Trash2,
    RefreshCw,
    HardDrive,
    Database,
    Calendar,
    CheckCircle,
    AlertCircle,
    Loader2,
    Wifi,
    WifiOff,
    Sparkles
} from 'lucide-react';
import { useOfflineDrugData } from '@/hooks/useOfflineDrugData';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const OfflineDataSettings: React.FC = () => {
    const {
        offlineStatus,
        isDownloading,
        downloadProgress,
        hasUpdates,
        estimatedSize,
        downloadOfflineData,
        deleteOfflineData,
        checkForUpdates,
        refreshStatus
    } = useOfflineDrugData();

    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Listen for online/offline changes
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleCheckUpdates = async () => {
        setIsCheckingUpdates(true);
        await checkForUpdates();
        setIsCheckingUpdates(false);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="border-0 sm:border shadow-none sm:shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl sm:text-xl flex items-center gap-2">
                            <Database className="w-5 h-5 text-[#0384c6] flex-shrink-0" />
                            Offline Data
                        </CardTitle>
                        <CardDescription className="text-sm mt-1.5 leading-relaxed">
                            Download medicines database for offline access
                        </CardDescription>
                    </div>
                    <Badge
                        variant={isOnline ? 'default' : 'secondary'}
                        className={`flex items-center gap-1.5 px-2.5 py-1 flex-shrink-0 ${isOnline ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}
                    >
                        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-6 space-y-5">
                {/* Status Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-blue-100 dark:border-blue-800 bg-gradient-to-br from-blue-50/70 to-cyan-50/70 dark:from-blue-950/30 dark:to-cyan-950/30">
                    {offlineStatus.isLoading ? (
                        <div className="flex items-center gap-3 text-muted-foreground py-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Checking offline data status...</span>
                        </div>
                    ) : offlineStatus.available ? (
                        <div className="space-y-5">
                            {/* Downloaded Status */}
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/40 flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-green-700 dark:text-green-400 text-base">
                                        Data Downloaded
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Medicines are available offline
                                    </p>
                                </div>
                                {hasUpdates && (
                                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 animate-pulse flex-shrink-0 px-2 py-1">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Update Available
                                    </Badge>
                                )}
                            </div>

                            {/* Stats Grid - 2x2 on mobile, row on tablet+ */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                                        <Database className="w-3.5 h-3.5" />
                                        Medicines
                                    </div>
                                    <p className="font-bold text-xl text-gray-900 dark:text-gray-100">
                                        {offlineStatus.drugCount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                                        <HardDrive className="w-3.5 h-3.5" />
                                        Storage Used
                                    </div>
                                    <p className="font-bold text-xl text-gray-900 dark:text-gray-100">
                                        {offlineStatus.formattedActualSize || offlineStatus.formattedSize}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-tight">
                                        Compressed in browser
                                    </p>
                                </div>
                            </div>

                            {/* Last Updated - Full width on mobile */}
                            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Last Updated
                                </div>
                                <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                    {formatDate(offlineStatus.lastUpdated)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <AlertCircle className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                                    No Offline Data
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Download the database to use PharmaLens without internet
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Estimated size: <span className="font-medium">{estimatedSize}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Download Progress */}
                {isDownloading && (
                    <div className="space-y-3 p-4 rounded-xl border bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#0384c6]" />
                                {downloadProgress < 15 && 'Preparing database...'}
                                {downloadProgress >= 15 && downloadProgress < 35 && 'Loading medicines data...'}
                                {downloadProgress >= 35 && downloadProgress < 95 && 'Saving to device storage...'}
                                {downloadProgress >= 95 && 'Finalizing...'}
                            </span>
                            <span className="font-bold text-[#0384c6] text-lg">{downloadProgress}%</span>
                        </div>
                        <Progress value={downloadProgress} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span className={downloadProgress >= 15 ? 'text-green-600' : ''}>
                                {downloadProgress >= 15 ? '✓' : '○'} Prepare
                            </span>
                            <span className={downloadProgress >= 35 ? 'text-green-600' : ''}>
                                {downloadProgress >= 35 ? '✓' : '○'} Load
                            </span>
                            <span className={downloadProgress >= 95 ? 'text-green-600' : ''}>
                                {downloadProgress >= 95 ? '✓' : '○'} Save
                            </span>
                            <span className={downloadProgress >= 100 ? 'text-green-600' : ''}>
                                {downloadProgress >= 100 ? '✓' : '○'} Done
                            </span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    {offlineStatus.available ? (
                        <>
                            {/* Update Button */}
                            {hasUpdates ? (
                                <Button
                                    onClick={downloadOfflineData}
                                    disabled={isDownloading || !isOnline}
                                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-base shadow-md"
                                >
                                    {isDownloading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Update Data
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handleCheckUpdates}
                                    disabled={isCheckingUpdates || !isOnline}
                                    className="flex-1"
                                >
                                    {isCheckingUpdates ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Check for Updates
                                </Button>
                            )}

                            {/* Delete Button */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-800 dark:hover:bg-red-950/30 font-medium"
                                        disabled={isDownloading}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Data
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Offline Data?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove all downloaded medicine data ({offlineStatus.formattedSize}).
                                            You'll need to download again to use the app offline.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={deleteOfflineData}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    ) : (
                        <Button
                            onClick={downloadOfflineData}
                            disabled={isDownloading || !isOnline}
                            className="w-full bg-[#0384c6] hover:bg-[#026a9e]"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            {isDownloading ? 'Downloading...' : `Download All Medicines (${estimatedSize})`}
                        </Button>
                    )}
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        <span className="font-medium">💡 Tip:</span> After downloading, you can search and view medicine details
                        even without internet. AI identification still requires internet connection.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default OfflineDataSettings;
