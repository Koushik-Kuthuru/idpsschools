import { initialMockData } from "../../data/mockData";

type DocData = Record<string, unknown>;

type RefBase = { __path: string };

export type CollectionReference = RefBase & { __type: "collection" };
export type DocumentReference = RefBase & { __type: "doc"; id: string };
export type Query = RefBase & { __type: "query"; constraints?: unknown[] };

function joinPath(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join("/");
}

function normalizePath(path: string) {
  return String(path || "").replace(/^\/+/, "").replace(/\/+/g, "/");
}

function keyForCollection(path: string) {
  return `mock_firestore_collection__${normalizePath(path)}`;
}

function loadCollection(path: string): Array<{ id: string; data: DocData }> {
  if (typeof window === "undefined") return [];

  try {
    const seededKey = "mock_firestore_seeded_v2"; // Changed to v2 to force re-seed
    if (!localStorage.getItem(seededKey)) {
      // Clear all existing mock_firestore keys first
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("mock_firestore_")) {
          localStorage.removeItem(key);
        }
      });
      
      // Seed initial data
      for (const [colPath, docs] of Object.entries(initialMockData)) {
        localStorage.setItem(keyForCollection(colPath), JSON.stringify(docs));
      }
      localStorage.setItem(seededKey, "true");
    }

    const raw = localStorage.getItem(keyForCollection(path));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCollection(path: string, rows: Array<{ id: string; data: DocData }>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyForCollection(path), JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("mock_firestore_update", { detail: path }));
}

function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function increment(n: number) {
  return n;
}

export function serverTimestamp() {
  return Date.now();
}

export function getFirestore(app?: unknown) {
  return {};
}

export function collection(_db: unknown, ...pathSegments: string[]): CollectionReference {
  return { __type: "collection", __path: normalizePath(joinPath(pathSegments)) };
}

export function doc(_dbOrCol: unknown, ...pathSegments: string[]): DocumentReference {
  const maybeCol = _dbOrCol as any;
  if (maybeCol && maybeCol.__type === "collection") {
    const colPath = String(maybeCol.__path || "");
    const id = pathSegments[0] ? String(pathSegments[0]) : randomId();
    const path = normalizePath(joinPath([colPath, id]));
    return { __type: "doc", __path: path, id };
  }

  const path = normalizePath(joinPath(pathSegments));
  const id = path.split("/").pop() || randomId();
  return { __type: "doc", __path: path, id };
}

export function query(ref: CollectionReference, ...constraints: unknown[]): Query {
  return { __type: "query", __path: ref.__path, constraints };
}

export function where(field: string, op: string, value: any) {
  return { __type: "where", field, op, value };
}

export function orderBy(field: string, dir: string = "asc") {
  return { __type: "orderBy", field, dir };
}

export function limit(n: number) {
  return { __type: "limit", n };
}

export async function addDoc(colRef: CollectionReference, data: DocData) {
  const id = randomId();
  const rows = loadCollection(colRef.__path);
  rows.push({ id, data });
  saveCollection(colRef.__path, rows);
  return { id };
}

export async function setDoc(docRef: DocumentReference, data: DocData, options?: { merge?: boolean }) {
  const parts = docRef.__path.split("/");
  const colPath = parts.slice(0, -1).join("/");
  const id = docRef.id;
  const rows = loadCollection(colPath);
  const idx = rows.findIndex((r) => r.id === id);

  if (idx >= 0) {
    const next = options?.merge ? { ...(rows[idx]?.data || {}), ...data } : data;
    rows[idx] = { id, data: next };
  } else {
    rows.push({ id, data });
  }

  saveCollection(colPath, rows);
}

export async function deleteDoc(docRef: DocumentReference) {
  const parts = docRef.__path.split("/");
  const colPath = parts.slice(0, -1).join("/");
  const id = docRef.id;
  const rows = loadCollection(colPath).filter((r) => r.id !== id);
  saveCollection(colPath, rows);
}

export async function updateDoc(docRef: DocumentReference, data: DocData) {
  return setDoc(docRef, data, { merge: true });
}

export async function getDocs(ref: CollectionReference | Query) {
  let rows = loadCollection(ref.__path);

  if (ref.__type === "query" && ref.constraints) {
    for (const c of ref.constraints as any[]) {
      if (c.__type === "where") {
        rows = rows.filter((r) => {
          const val = (r.data as any)[c.field];
          if (c.op === "==") return val === c.value;
          if (c.op === "!=") return val !== c.value;
          if (c.op === ">") return val > c.value;
          if (c.op === "<") return val < c.value;
          if (c.op === ">=") return val >= c.value;
          if (c.op === "<=") return val <= c.value;
          if (c.op === "in") return Array.isArray(c.value) && c.value.includes(val);
          return true;
        });
      } else if (c.__type === "orderBy") {
        rows.sort((a, b) => {
          const valA = (a.data as any)[c.field];
          const valB = (b.data as any)[c.field];
          if (valA < valB) return c.dir === "desc" ? 1 : -1;
          if (valA > valB) return c.dir === "desc" ? -1 : 1;
          return 0;
        });
      } else if (c.__type === "limit") {
        rows = rows.slice(0, c.n);
      }
    }
  }

  const docs = rows.map((r) => ({
    id: r.id,
    data: () => r.data,
    ref: { id: r.id, __path: `${ref.__path}/${r.id}` },
  }));

  return { docs, size: docs.length };
}

export async function getDoc(docRef: DocumentReference) {
  const parts = docRef.__path.split("/");
  const colPath = parts.slice(0, -1).join("/");
  const id = docRef.id;
  const rows = loadCollection(colPath);
  const found = rows.find((r) => r.id === id);
  return {
    exists: () => Boolean(found),
    data: () => (found ? found.data : undefined),
    id,
    ref: docRef,
  };
}

export function onSnapshot(
  ref: CollectionReference | Query | DocumentReference,
  onNext: (snap: any) => void,
  onError?: (err: any) => void
) {
  let isUnsubscribed = false;

  const fetchAndNotify = async () => {
    if (isUnsubscribed) return;
    try {
      if ((ref as any).__type === "doc") {
        const snap = await getDoc(ref as DocumentReference);
        onNext(snap);
      } else {
        const snap = await getDocs(ref as any);
        onNext(snap);
      }
    } catch (e) {
      onError?.(e);
    }
  };

  // Initial fetch
  fetchAndNotify();

  // Listen for local updates
  const handler = (e: any) => {
    // If the updated path matches or is a child of our path, refetch
    if (e.detail && (String(e.detail).startsWith(ref.__path) || String(ref.__path).startsWith(String(e.detail)))) {
      fetchAndNotify();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("mock_firestore_update", handler);
  }

  return () => {
    isUnsubscribed = true;
    if (typeof window !== "undefined") {
      window.removeEventListener("mock_firestore_update", handler);
    }
  };
}
