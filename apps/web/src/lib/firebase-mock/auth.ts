export type User = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

export type Auth = { currentUser: User | null };

const authSingleton: Auth = { currentUser: null };

export function getAuth(_app?: unknown): Auth {
  return authSingleton;
}

export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void) {
  queueMicrotask(() => callback(auth.currentUser));
  return () => {};
}

export async function signInWithEmailAndPassword(auth: Auth, email: string, _password: string) {
  const user: User = { uid: "mock_uid", email, displayName: email.split("@")[0] ?? null };
  auth.currentUser = user;
  return { user };
}

export async function signOut(auth: Auth) {
  auth.currentUser = null;
}

