"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {buildPreviewSrcdoc, PREVIEW_MESSAGE_SOURCE} from "@/lib/editor/preview";
import type {Sketch} from "@/lib/editor/vfs";

interface LogEntry {
  level: "log" | "info" | "warn" | "error" | "debug";
  text: string;
  id: number;
}

interface Props {
  sketch: Sketch;
  runKey: number; // bump to force a full reload (kills rAF / WebGL / audio)
  onCapture?: (dataUrl: string) => void; // receives the captured thumbnail (PNG data URL)
}

const LEVEL_COLOR: Record<string, string> = {
  log: "#c9d1d9",
  info: "#58a6ff",
  warn: "#d29922",
  error: "#f85149",
  debug: "#8b949e",
};

// Keep the stored thumbnail small: it rides along in the draft (IndexedDB /
// Firestore, 1MB doc limit) — full-res canvases would blow that up.
const THUMB_MAX_DIM = 1000;

function downscale(dataUrl: string, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      if (scale >= 1) return resolve(dataUrl);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("thumbnail decode failed"));
    img.src = dataUrl;
  });
}

export default function Preview({sketch, runKey, onCapture}: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(true);
  const idRef = useRef(0);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onCaptureRef = useRef(onCapture);
  useEffect(() => {
    onCaptureRef.current = onCapture;
  });

  const pushLog = (level: LogEntry["level"], text: string) => {
    setLogs((prev) => [...prev.slice(-199), {level, text, id: idRef.current++}]);
  };

  const capture = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {__src: PREVIEW_MESSAGE_SOURCE, type: "capture"},
      "*",
    );
  };

  // Rebuild the document only when the run key changes — typing shouldn't
  // thrash the iframe; the parent decides when to (re)run.
  const srcdoc = useMemo(
    () => buildPreviewSrcdoc(sketch),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runKey],
  );

  // Clear the console on every fresh run.
  useEffect(() => {
    setLogs([]);
  }, [runKey]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.__src !== PREVIEW_MESSAGE_SOURCE) return;
      if (d.type === "console") {
        setLogs((prev) => [
          ...prev.slice(-199),
          {level: d.level, text: d.text, id: idRef.current++},
        ]);
      } else if (d.type === "error") {
        setLogs((prev) => [
          ...prev.slice(-199),
          {level: "error", text: d.text, id: idRef.current++},
        ]);
      } else if (d.type === "thumbnail") {
        downscale(d.dataUrl, THUMB_MAX_DIM)
          .then((url) => {
            onCaptureRef.current?.(url);
            pushLog("info", "サムネイルをキャプチャしました");
          })
          .catch((err) => pushLog("error", String(err)));
      } else if (d.type === "thumbnail-error") {
        pushLog("error", d.text);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({block: "nearest"});
  }, [logs]);

  const errorCount = logs.filter((l) => l.level === "error").length;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 min-h-0">
        <iframe
          key={runKey}
          ref={iframeRef}
          srcDoc={srcdoc}
          title="preview"
          className="h-full w-full border-0"
          sandbox="allow-scripts"
        />
      </div>

      {/* Console panel */}
      <div className="flex flex-col border-t border-[#30363d] bg-[#0d1117]">
        <div
          className="flex items-center justify-between px-3 py-1 text-xs"
          style={{fontFamily: "ui-monospace, monospace"}}
        >
          <button
            onClick={() => setShowConsole((s) => !s)}
            className="flex flex-1 items-center justify-between text-gray-400 hover:text-gray-200"
          >
            <span>
              Console{" "}
              {errorCount > 0 && (
                <span className="text-[#f85149]">({errorCount} error{errorCount > 1 ? "s" : ""})</span>
              )}
            </span>
            <span>{showConsole ? "▾" : "▸"}</span>
          </button>
          {onCapture && (
            <button
              onClick={capture}
              className="ml-4 shrink-0 text-gray-500 hover:text-gray-200"
              title="実行中のキャンバスをサムネイルとしてキャプチャ"
            >
              📷 thumbnail
            </button>
          )}
        </div>
        {showConsole && (
          <div
            className="h-32 overflow-auto px-3 pb-2 text-xs leading-relaxed"
            style={{fontFamily: "ui-monospace, monospace"}}
          >
            {logs.length === 0 ? (
              <div className="text-gray-600">— no output —</div>
            ) : (
              logs.map((l) => (
                <div
                  key={l.id}
                  style={{color: LEVEL_COLOR[l.level], whiteSpace: "pre-wrap"}}
                >
                  {l.text}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
