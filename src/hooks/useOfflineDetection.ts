import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook to detect online/offline status and show appropriate notifications
 */
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Only show "back online" toast if user was previously offline
      if (wasOffline) {
        toast.success('🌐 Back Online!', {
          description: 'You can now use drug identification features',
          duration: 3000
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      toast.warning('📴 You are offline', {
        description: 'Drug identification requires internet. Other features work offline.',
        duration: 5000,
        action: {
          label: 'Dismiss',
          onClick: () => {}
        }
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setWasOffline(true);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  /**
   * Check if online before attempting an action
   * @param action - Name of the action being attempted
   * @returns true if online, false if offline (shows toast)
   */
  const checkOnlineStatus = (action: string = 'This action'): boolean => {
    if (!isOnline) {
      toast.error(`📴 No Internet Connection`, {
        description: `${action} requires an internet connection`,
        duration: 4000
      });
      return false;
    }
    return true;
  };

  return {
    isOnline,
    wasOffline,
    checkOnlineStatus
  };
};
