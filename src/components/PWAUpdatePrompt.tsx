import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * PWA Update Prompt Component
 * Automatically detects new deployments and prompts user to update
 * Shows a toast notification with update button
 */
export const PWAUpdatePrompt = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registered:', r);
      
      // Check for updates every 60 seconds
      if (r) {
        setInterval(() => {
          console.log('🔍 Checking for app updates...');
          r.update();
        }, 60000); // Check every 1 minute
      }
    },
    onRegisterError(error) {
      console.error('❌ Service Worker registration error:', error);
    },
    onNeedRefresh() {
      console.log('🆕 New version available!');
      setUpdateAvailable(true);
      setNeedRefresh(true);
      
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
            setNeedRefresh(false);
          }
        }
      });
    },
    onOfflineReady() {
      console.log('✅ App ready to work offline!');
      toast.success('📴 Offline Mode Ready', {
        description: 'You can now use medications, symptom checker, and drug interactions offline',
        duration: 5000
      });
    },
  });

  const handleUpdate = async () => {
    console.log('🔄 Updating to new version...');
    toast.loading('Updating app...', { id: 'app-update' });
    
    try {
      await updateServiceWorker(true);
      
      // Show success and reload
      toast.success('✅ Updated!', {
        id: 'app-update',
        description: 'Reloading app with latest version...',
        duration: 2000
      });
      
      // Reload after short delay to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('❌ Update error:', error);
      toast.error('Update failed', {
        id: 'app-update',
        description: 'Please refresh manually',
        duration: 4000
      });
    }
  };

  // Auto-update in 30 seconds if user doesn't respond
  useEffect(() => {
    if (needRefresh && updateAvailable) {
      const autoUpdateTimer = setTimeout(() => {
        console.log('⏰ Auto-updating after 30 seconds...');
        toast.info('Auto-updating...', { duration: 2000 });
        handleUpdate();
      }, 30000); // 30 seconds

      return () => clearTimeout(autoUpdateTimer);
    }
  }, [needRefresh, updateAvailable]);

  return null; // This component doesn't render anything visually
};
