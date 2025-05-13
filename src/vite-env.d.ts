
/// <reference types="vite/client" />

// Extend the ServiceWorkerRegistration interface to include the sync property
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  sync?: SyncManager;
}

interface Window {
  SyncManager?: SyncManager;
}
