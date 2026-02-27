import { useState, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Hook to detect online/offline status and show appropriate notifications.
 * Uses a ref for wasOffline tracking so the effect only runs once on mount,
 * preventing duplicate event listeners and duplicate toast notifications.
 * 
 * @param options Configuration options
 * @param options.showNotifications Whether to automatically show toasts on status change (default: true)
 */
export const useOfflineDetection = (options: { showNotifications?: boolean } = {}) => {
  const { showNotifications = true } = options;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      // Only show "back online" toast if user was previously offline
      if (wasOfflineRef.current) {
        if (showNotifications) {
          toast.success('🌐 Back Online!', {
            id: 'network-status',
            description: 'You can now use drug identification features',
            duration: 3000
          });
        }
        wasOfflineRef.current = false;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;

      if (showNotifications) {
        toast.warning('📴 You are offline', {
          id: 'network-status',
          description: 'Drug identification requires internet. Other features work offline.',
          duration: 5000,
          action: {
            label: 'Dismiss',
            onClick: () => { }
          }
        });
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      wasOfflineRef.current = true;
    }

    // Cleanup — runs only on unmount since dependency array is empty
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array — register listeners only once

  /**
   * Check if online before attempting an action
   * @param action - Name of the action being attempted
   * @returns true if online, false if offline (shows toast)
   */
  const checkOnlineStatus = (action: string = 'This action'): boolean => {
    if (!isOnline) {
      toast.error(`📴 No Internet Connection`, {
        id: 'network-check',
        description: `${action} requires an internet connection`,
        duration: 4000
      });
      return false;
    }
    return true;
  };

  return {
    isOnline,
    wasOffline: wasOfflineRef.current,
    checkOnlineStatus
  };
};
