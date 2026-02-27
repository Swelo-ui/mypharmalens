import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Enhanced PWA Installation Prompt
 * Works on all browsers with custom UI fallback
 * Shows toast notification and dismissible card
 */
export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ PWA installed!');
          toast.success('🎉 Installed!', {
            description: 'PharmaLens is now on your home screen',
            duration: 4000
          });
        } else {
          console.log('❌ PWA installation declined');
        }
        
        setDeferredPrompt(null);
        setShowInstallCard(false);
      } catch (error) {
        console.error('PWA install error:', error);
      }
    } else if (isIOS) {
      // Show iOS installation instructions
      toast.info('📱 Install on iOS', {
        description: 'Tap Share button, then "Add to Home Screen"',
        duration: 10000
      });
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowInstallCard(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    toast.dismiss();
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    if (!standalone && daysSinceDismissed > 7) {
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        const promptEvent = e as BeforeInstallPromptEvent;
        setDeferredPrompt(promptEvent);
        setShowInstallCard(true);
        
        toast.info('📱 Install PharmaLens', {
          description: 'Get quick access from your home screen',
          duration: 8000,
          action: {
            label: 'Install',
            onClick: () => handleInstallClick()
          },
          cancel: {
            label: 'Not now',
            onClick: () => handleDismiss()
          }
        });
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      if (iOS && !standalone) {
        setTimeout(() => {
          setShowInstallCard(true);
        }, 10000);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, [handleDismiss, handleInstallClick]);

  // Don't show if already installed
  if (isStandalone || !showInstallCard) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-lg z-50 border-primary/20 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          {isIOS ? <Smartphone className="h-5 w-5 text-primary" /> : <Download className="h-5 w-5 text-primary" />}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            Install PharmaLens
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isIOS 
              ? 'Tap Share button, then "Add to Home Screen"' 
              : 'Get quick access and work offline'}
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="flex-1"
            >
              {isIOS ? 'Show How' : 'Install'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="h-8 w-8 -mt-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
