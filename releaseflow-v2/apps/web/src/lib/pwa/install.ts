/**
 * CE-008 — Install experience (beforeinstallprompt).
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(canInstall: boolean) => void>();

export function initInstallPrompt(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onBip = (e: Event) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    for (const cb of listeners) cb(true);
  };

  const onInstalled = () => {
    deferred = null;
    for (const cb of listeners) cb(false);
  };

  window.addEventListener('beforeinstallprompt', onBip);
  window.addEventListener('appinstalled', onInstalled);

  return () => {
    window.removeEventListener('beforeinstallprompt', onBip);
    window.removeEventListener('appinstalled', onInstalled);
  };
}

export function onCanInstall(cb: (canInstall: boolean) => void): () => void {
  listeners.add(cb);
  cb(!!deferred);
  return () => listeners.delete(cb);
}

export function canInstallApp(): boolean {
  return !!deferred;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  for (const cb of listeners) cb(false);
  return outcome;
}
