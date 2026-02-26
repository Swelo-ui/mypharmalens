import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * PWA Update Prompt Component
 * Automatically detects new deployments and prompts user to update
 * Shows a toast notification with update button
 */
export const PWAUpdatePrompt = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const handleUpdate = useCallback(async () => {
    console.log('🔄 Updating to new version...');
    toast.loading('Updating app...', { id: 'app-update' });

    try {
      if (registration && registration.waiting) {
        // Tell the waiting service worker to skip waiting and become active
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Show success message
        toast.success('✅ Updated!', {
          id: 'app-update',
          description: 'Reloading app with latest version...',
          duration: 2000
        });

        // Reload after short delay to show success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Fallback: just reload
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      toast.error('Update failed', {
        id: 'app-update',
        description: 'Please refresh manually',
        duration: 4000
      });
    }
  }, [registration]);

  useEffect(() => {
    // Register service worker and handle updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker registered:', reg);
          setRegistration(reg);

          // Check for updates every 60 seconds
          setInterval(() => {
            console.log('🔍 Checking for app updates...');
            reg.update();
          }, 60000); // Check every 1 minute

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🆕 New version available!');
                  setUpdateAvailable(true);

                  // Show persistent toast notification
                  toast.info('🎉 Update Available!', {
                    description: 'A new version of PharmaLens is ready',
                    duration: Infinity, // Don't auto-dismiss
                    action: {
                      label: 'Update Now',
                      onClick: () => handleUpdate()
                    },
                    cancel: {
                      label: 'Later',
                      onClick: () => {
                        setUpdateAvailable(false);
                      }
                    }
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration error:', error);
        });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('✅ New service worker activated!');
        window.location.reload();
      });

      // Check if app is ready to work offline
      navigator.serviceWorker.ready.then(() => {
        console.log('✅ App ready to work offline!');

        let offlineToastShown = false;

        const showOfflineToast = () => {
          if (offlineToastShown) return;
          offlineToastShown = true;

          toast.success('📴 Offline Mode Ready', {
            description:
              'You can now use medications, symptom checker, and drug interactions offline',
            duration: 5000,
          });
        };

        // If the app is already offline when ready
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          showOfflineToast();
        }

        // Show toast whenever the user goes offline
        if (typeof window !== 'undefined') {
          window.addEventListener('offline', showOfflineToast);
        }
      });
    }
  }, [handleUpdate]);

  // Auto-update in 5 seconds if user doesn't respond
  useEffect(() => {
    if (updateAvailable) {
      const autoUpdateTimer = setTimeout(() => {
        console.log('⏰ Auto-updating after 5 seconds...');
        toast.info('Auto-updating...', { duration: 2000 });
        handleUpdate();
      }, 5000); // 5 seconds

      return () => clearTimeout(autoUpdateTimer);
    }
  }, [updateAvailable, handleUpdate]);

  return null; // This component doesn't render anything visually
};
