"use client";

import {useEffect, useState} from "react";
import type {User} from "firebase/auth";
import {
  firebaseEnabled,
  isAllowed,
  onAuthChange,
  signInWithGoogle,
} from "@/lib/editor/firebase";

// Gates the editor to the single allowed account when Firebase is configured.
// When Firebase isn't configured (local dev), it renders children directly so
// the editor works with no setup.
export default function AuthGate({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(!firebaseEnabled);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthChange((u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  if (!firebaseEnabled) return <>{children}</>;

  if (ready && isAllowed(user)) return <>{children}</>;

  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0d1117] text-gray-300"
      style={{fontFamily: "ui-monospace, monospace"}}
    >
      <div className="text-sm text-gray-400">editor</div>
      {!ready ? (
        <div className="text-xs text-gray-600">…</div>
      ) : (
        <>
          <button
            onClick={async () => {
              setError(null);
              try {
                await signInWithGoogle();
              } catch (e) {
                setError(e instanceof Error ? e.message : "サインインに失敗しました");
              }
            }}
            className="rounded-md border border-[#30363d] bg-[#161b22] px-5 py-2 text-sm text-gray-200 hover:border-[#58a6ff]"
          >
            Google でサインイン
          </button>
          {user && !isAllowed(user) && (
            <div className="text-xs text-[#f85149]">
              {user.email} はアクセスを許可されていません
            </div>
          )}
          {error && <div className="text-xs text-[#f85149]">{error}</div>}
        </>
      )}
    </div>
  );
}
