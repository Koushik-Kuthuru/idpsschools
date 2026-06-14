export type FirebaseApp = { name?: string };

let singleton: FirebaseApp | null = null;

export function initializeApp(_config?: unknown): FirebaseApp {
  if (!singleton) singleton = { name: "mock" };
  return singleton;
}

export function getApps(): FirebaseApp[] {
  return singleton ? [singleton] : [];
}

export function getApp(): FirebaseApp {
  if (!singleton) singleton = { name: "mock" };
  return singleton;
}

