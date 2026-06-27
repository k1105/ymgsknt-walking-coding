// Firebase integration — tier-2 (cross-device) persistence + single-user auth.
//
// Gated on env config: if NEXT_PUBLIC_FIREBASE_* is absent the whole module
// degrades to a no-op (firebaseEnabled === false) and the editor runs purely on
// the IndexedDB draft layer. So local dev needs zero Firebase setup; production
// turns it on by providing the env vars.
//
// Access is restricted to a single Google account (ALLOWED_EMAIL). The real
// enforcement is the Firestore Security Rules (see firestore.rules) — the
// client checks below are only for UX.

import {initializeApp, getApps, type FirebaseApp} from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Firestore,
} from "firebase/firestore";
import type {Sketch} from "./vfs";

// The only account allowed to read/write. Mirror this exactly in the
// Firestore Security Rules.
export const ALLOWED_EMAIL = "kntymgs1105@gmail.com";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function ensure(): {auth: Auth; db: Firestore} | null {
  if (!firebaseEnabled) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return {auth: auth!, db: db!};
}

export function isAllowed(user: User | null): boolean {
  return Boolean(user && user.email === ALLOWED_EMAIL);
}

export async function signInWithGoogle(): Promise<User | null> {
  const fb = ensure();
  if (!fb) return null;
  const res = await signInWithPopup(fb.auth, new GoogleAuthProvider());
  if (!isAllowed(res.user)) {
    await signOut(fb.auth);
    throw new Error("このアカウントはアクセスを許可されていません");
  }
  return res.user;
}

export async function signOutUser(): Promise<void> {
  const fb = ensure();
  if (fb) await signOut(fb.auth);
}

// Calls back with the current user (or null). Returns an unsubscribe fn.
export function onAuthChange(cb: (user: User | null) => void): () => void {
  const fb = ensure();
  if (!fb) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(fb.auth, cb);
}

interface CloudDoc {
  sketch: Sketch;
  updatedAt: number;
}

export async function loadCloudSketch(id: string): Promise<CloudDoc | null> {
  const fb = ensure();
  if (!fb) return null;
  const snap = await getDoc(doc(fb.db, "sketches", id));
  return snap.exists() ? (snap.data() as CloudDoc) : null;
}

export async function saveCloudSketch(
  sketch: Sketch,
  updatedAt: number,
): Promise<void> {
  const fb = ensure();
  if (!fb) return;
  await setDoc(
    doc(fb.db, "sketches", sketch.id),
    {sketch, updatedAt},
    {merge: true},
  );
}

export function subscribeCloudSketch(
  id: string,
  cb: (doc: CloudDoc | null) => void,
): () => void {
  const fb = ensure();
  if (!fb) return () => {};
  return onSnapshot(doc(fb.db, "sketches", id), (snap) => {
    cb(snap.exists() ? (snap.data() as CloudDoc) : null);
  });
}
