// IndexedDB draft store — the first tier of the two-tier autosave.
//
// Every edit is debounced into here immediately, so an in-progress sketch
// survives reload / crash / offline, even before (or without) cloud sign-in.
// The second tier (cross-device source of truth) is Firestore — see
// firebase.ts. On reopen we load the draft and reconcile against the cloud by
// updatedAt (newer wins).

import type {Sketch} from "./vfs";

const DB_NAME = "editor-drafts";
const STORE = "sketches";
const VERSION = 1;

export interface DraftRecord {
  id: string;
  sketch: Sketch;
  updatedAt: number;
}

function hasIDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, {keyPath: "id"});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// `updatedAt` is passed in (callers stamp it) so this stays deterministic and
// testable; the editor passes Date.now() at call time.
export async function saveDraft(sketch: Sketch, updatedAt: number): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({id: sketch.id, sketch, updatedAt} as DraftRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadDraft(id: string): Promise<DraftRecord | null> {
  if (!hasIDB()) return null;
  const db = await openDb();
  const rec = await new Promise<DraftRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as DraftRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rec;
}

export async function deleteDraft(id: string): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listDrafts(): Promise<DraftRecord[]> {
  if (!hasIDB()) return [];
  const db = await openDb();
  const all = await new Promise<DraftRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as DraftRecord[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all;
}
