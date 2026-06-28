"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import CodeEditor from "./CodeEditor";
import Preview from "./Preview";
import Sidebar from "./Sidebar";
import {defaultSketch, langOf, makeFile, type Sketch} from "@/lib/editor/vfs";
import {loadDraft, saveDraft} from "@/lib/editor/draft";
import {alignTyped, matchCount} from "@/lib/editor/align";
import {
  firebaseEnabled,
  isAllowed,
  loadCloudSketch,
  onAuthChange,
  saveCloudSketch,
  signOutUser,
  subscribeCloudSketch,
} from "@/lib/editor/firebase";

export default function EditorClient() {
  const [sketch, setSketch] = useState<Sketch>(() => defaultSketch("draft"));
  const [activeFile, setActiveFile] = useState<string>("sketch.js");
  const [runKey, setRunKey] = useState(0);
  const [autoRun, setAutoRun] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  const draftReady = useRef(false);
  const cloudReady = useRef(false);
  const savedAtRef = useRef<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  // Trace (写経) mode. The typed buffer is kept separate from the VFS so
  // practising never mutates the saved sketch; the active file's content is
  // the target shown as ghost.
  const [traceMode, setTraceMode] = useState(false);
  const [traceTyped, setTraceTyped] = useState("");

  // Diary panel. sketch.diary is written out as diary.md on publish.
  const [showDiary, setShowDiary] = useState(false);
  const updateDiary = useCallback((diary: string) => {
    setSketch((prev) => ({...prev, diary}));
  }, []);

  // Keep a ref of the latest savedAt so async cloud callbacks don't read a
  // stale closure when reconciling by timestamp.
  savedAtRef.current = savedAt;

  const filenames = Object.keys(sketch.files);
  const active = sketch.files[activeFile];

  const updateActive = useCallback(
    (content: string) => {
      setSketch((prev) => ({
        ...prev,
        files: {
          ...prev.files,
          [activeFile]: {...prev.files[activeFile], content},
        },
      }));
    },
    [activeFile],
  );

  const addFile = useCallback((name: string) => {
    setSketch((prev) => {
      if (prev.files[name]) return prev;
      return {...prev, files: {...prev.files, [name]: makeFile(name, "")}};
    });
    setActiveFile(name);
  }, []);

  const deleteFile = useCallback(
    (name: string) => {
      setSketch((prev) => {
        if (name === prev.entry) return prev;
        const files = {...prev.files};
        delete files[name];
        return {...prev, files};
      });
      setActiveFile((cur) =>
        cur === name ? sketch.entry : cur,
      );
    },
    [sketch.entry],
  );

  const renameFile = useCallback(
    (oldName: string, newName: string) => {
      setSketch((prev) => {
        if (!prev.files[oldName] || prev.files[newName]) return prev;
        const files: typeof prev.files = {};
        // Preserve insertion order by walking the original keys.
        for (const key of Object.keys(prev.files)) {
          if (key === oldName) {
            files[newName] = {
              ...prev.files[oldName],
              name: newName,
              lang: langOf(newName),
            };
          } else {
            files[key] = prev.files[key];
          }
        }
        const entry = prev.entry === oldName ? newName : prev.entry;
        return {...prev, files, entry};
      });
      setActiveFile((cur) => (cur === oldName ? newName : cur));
    },
    [],
  );

  const setIndexHtml = useCallback(
    (html: string) => {
      setSketch((prev) => ({
        ...prev,
        files: {
          ...prev.files,
          [prev.entry]: {...prev.files[prev.entry], content: html},
        },
      }));
    },
    [],
  );

  const run = useCallback(() => setRunKey((k) => k + 1), []);

  // Tier 1 persistence + seeding. On mount: if opened as /editor?source=<id>
  // (from the network "+"), seed a fresh working draft from that published
  // sketch; otherwise restore the local draft from IndexedDB. draftReady guards
  // against the initial default-sketch save racing ahead of (and clobbering)
  // the restore/seed.
  useEffect(() => {
    let cancelled = false;
    const source =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("source")
        : null;

    const seedFromSource = async (id: string) => {
      const res = await fetch(`/api/load-sketch?id=${encodeURIComponent(id)}`);
      if (!res.ok) return false;
      const data = await res.json();
      if (!data?.files || cancelled) return false;
      const files: Sketch["files"] = {};
      for (const [name, f] of Object.entries(
        data.files as Record<string, {content?: string; dataUrl?: string}>,
      )) {
        const vf = makeFile(name, f.content ?? "");
        if (f.dataUrl) vf.dataUrl = f.dataUrl;
        files[name] = vf;
      }
      const entry = files[data.entry] ? data.entry : Object.keys(files)[0];
      setSketch({
        id: "draft",
        entry,
        files,
        libraries: [],
        diary: data.diary ?? "",
        parentId: id,
      });
      // Prefer landing on a JS file to start editing/tracing.
      const js = Object.keys(files).find((n) => n.endsWith(".js"));
      setActiveFile(js ?? entry);
      return true;
    };

    const init = async () => {
      if (source) {
        const ok = await seedFromSource(source).catch(() => false);
        if (ok) return; // seeded — don't clobber with the old draft
      }
      const rec = await loadDraft("draft").catch(() => null);
      if (cancelled || !rec?.sketch?.files) return;
      setSketch(rec.sketch);
      setActiveFile((cur) => (rec.sketch.files[cur] ? cur : rec.sketch.entry));
      setSavedAt(rec.updatedAt);
    };

    init().finally(() => {
      if (!cancelled) draftReady.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftReady.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const t = Date.now();
      saveDraft(sketch, t)
        .then(() => setSavedAt(t))
        .catch(() => {});
      // Tier 2: push to the cloud when signed in. The cloud snapshot will echo
      // this back with updatedAt === t, which the reconcile guard (strictly
      // greater) ignores — so no feedback loop.
      if (cloudReady.current) saveCloudSketch(sketch, t).catch(() => {});
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [sketch]);

  // Tier 2 persistence: when signed in as the allowed user, reconcile against
  // the cloud (newer updatedAt wins) and subscribe for cross-device updates.
  useEffect(() => {
    if (!firebaseEnabled) return;
    let unsubSnap = () => {};
    const unsubAuth = onAuthChange(async (u) => {
      const allowed = isAllowed(u);
      setSignedIn(allowed);
      cloudReady.current = allowed;
      if (!allowed) {
        unsubSnap();
        unsubSnap = () => {};
        return;
      }
      const cloud = await loadCloudSketch("draft").catch(() => null);
      if (
        cloud?.sketch?.files &&
        cloud.updatedAt > (savedAtRef.current ?? 0)
      ) {
        setSketch(cloud.sketch);
        setSavedAt(cloud.updatedAt);
      }
      unsubSnap = subscribeCloudSketch("draft", (c) => {
        if (c?.sketch?.files && c.updatedAt > (savedAtRef.current ?? 0)) {
          setSketch(c.sketch);
          setSavedAt(c.updatedAt);
        }
      });
    });
    return () => {
      unsubAuth();
      unsubSnap();
    };
  }, []);

  // Debounced auto-run on any file change. Skip the very first invocation —
  // the initial render already runs the sketch at runKey 0, and an immediate
  // reload would flash the preview and clear the console mid-stream.
  useEffect(() => {
    if (!autoRun) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => setRunKey((k) => k + 1), 800);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [sketch, autoRun]);

  // Trace progress (matched original chars / total).
  const traceProgress = useMemo(() => {
    if (!traceMode || !active) return 0;
    const original = active.content;
    if (!original.length) return 0;
    const a = alignTyped(original, traceTyped);
    return Math.round((matchCount(a) / original.length) * 100);
  }, [traceMode, active, traceTyped]);

  const toggleTrace = useCallback(() => {
    setTraceMode((on) => {
      if (!on) setTraceTyped(""); // entering: start from a blank buffer
      return !on;
    });
  }, []);

  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const publish = useCallback(async () => {
    setPublishMsg("publishing…");
    try {
      const res = await fetch("/api/publish-sketch", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          sketch,
          diary: sketch.diary ?? "",
          parentId: sketch.parentId,
        }),
      });
      const data = await res.json();
      setPublishMsg(res.ok ? `published → ${data.date}` : data.error || "failed");
    } catch {
      setPublishMsg("failed");
    }
    setTimeout(() => setPublishMsg(null), 4000);
  }, [sketch]);

  return (
    <div className="flex h-screen flex-col bg-[#0d1117] text-gray-300">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-[#30363d] px-4 py-2"
        style={{fontFamily: "ui-monospace, monospace"}}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">editor</span>
          {savedAt && (
            <span className="text-[10px] text-gray-600">draft saved</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {traceMode && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">{traceProgress}%</span>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-[#21262d]">
                <div
                  className="h-full bg-[#238636] transition-all"
                  style={{width: `${traceProgress}%`}}
                />
              </div>
            </div>
          )}
          <button
            onClick={toggleTrace}
            className={`text-xs transition-colors ${
              traceMode ? "text-[#58a6ff]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="写経モード"
          >
            写経
          </button>
          <button
            onClick={() => setShowDiary((v) => !v)}
            className={`text-xs transition-colors ${
              showDiary ? "text-[#58a6ff]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="日記を書く（Publish時に diary.md として保存）"
          >
            日記
          </button>
          <label className="flex items-center gap-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
            />
            auto-run
          </label>
          <button
            onClick={run}
            className="rounded-md bg-[#238636] px-4 py-1 text-xs text-white hover:bg-[#2ea043]"
          >
            ▶ Run
          </button>
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={publish}
              className="rounded-md border border-[#30363d] px-3 py-1 text-xs text-gray-300 hover:border-[#58a6ff]"
            >
              Publish
            </button>
          )}
          {publishMsg && (
            <span className="text-[10px] text-gray-500">{publishMsg}</span>
          )}
          {signedIn && (
            <button
              onClick={() => signOutUser()}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              sign out
            </button>
          )}
        </div>
      </div>

      {/* Sidebar | Editor | Preview */}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          files={filenames}
          activeFile={activeFile}
          entry={sketch.entry}
          onSelect={setActiveFile}
          onAddFile={addFile}
          onRenameFile={renameFile}
          onDeleteFile={deleteFile}
          indexHtml={sketch.files[sketch.entry]?.content ?? ""}
          onIndexHtmlChange={setIndexHtml}
        />
        <div className="flex min-h-0 flex-1 flex-col border-r border-[#30363d]">
          <div className="min-h-0 flex-1 overflow-hidden">
            {active &&
              (traceMode ? (
                <CodeEditor
                  key={`trace-${activeFile}`}
                  filename={activeFile}
                  value={traceTyped}
                  onChange={setTraceTyped}
                  traceOriginal={active.content}
                />
              ) : (
                <CodeEditor
                  key={activeFile}
                  filename={activeFile}
                  value={active.content}
                  onChange={updateActive}
                />
              ))}
          </div>
          {showDiary && (
            <div className="flex h-2/5 min-h-0 flex-col border-t border-[#30363d]">
              <div
                className="flex items-center justify-between border-b border-[#30363d] px-3 py-1"
                style={{fontFamily: "ui-monospace, monospace"}}
              >
                <span className="text-[10px] text-gray-500">
                  diary.md{" "}
                  {sketch.parentId && (
                    <span className="text-gray-600">
                      （{sketch.parentId} の続き）
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setShowDiary(false)}
                  className="text-[10px] text-gray-600 hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={sketch.diary ?? ""}
                onChange={(e) => updateDiary(e.target.value)}
                placeholder="この日のスケッチについて（Markdown）…"
                spellCheck={false}
                className="min-h-0 flex-1 resize-none bg-[#0d1117] px-3 py-2 text-sm text-gray-300 outline-none placeholder:text-gray-700"
                style={{fontFamily: "ui-monospace, monospace"}}
              />
            </div>
          )}
        </div>
        <div className="min-h-0 w-[42%]">
          <Preview sketch={sketch} runKey={runKey} />
        </div>
      </div>
    </div>
  );
}
