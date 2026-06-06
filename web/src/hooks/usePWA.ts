import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable:    boolean;
  isInstalled:      boolean;
  isOffline:        boolean;
  updateAvailable:  boolean;
  install:          () => Promise<boolean>;
  applyUpdate:      () => void;
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [isOffline, setIsOffline]         = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Установлено как PWA?
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mq.matches || (navigator as any).standalone === true);
    const onChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', onChange);

    // Запрос на установку
    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);

    // После установки
    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    });

    // Online/offline
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    // SW обновление
    const onUpdate = () => setUpdateAvailable(true);
    window.addEventListener('sw-update-available', onUpdate);

    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('sw-update-available', onUpdate);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
    return outcome === 'accepted';
  };

  const applyUpdate = () => {
    navigator.serviceWorker.getRegistration().then(reg => {
      reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });
  };

  return {
    isInstallable:   !!installPrompt && !isInstalled,
    isInstalled,
    isOffline,
    updateAvailable,
    install,
    applyUpdate,
  };
}
