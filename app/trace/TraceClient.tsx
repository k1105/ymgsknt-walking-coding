"use client";

import {useState, useRef, useEffect, useCallback, useMemo} from "react";
import {useSearchParams, useRouter} from "next/navigation";

// Forward streaming alignment with whitespace-tolerant lookahead.
// Whitespace runs don't count toward the lookahead budget, so indent/newline
// differences can be absorbed without painting the rest of the file red.
// Tie-breaks prefer treating extra typed chars as insertions over marking
// original chars as deletions.
function alignTyped(
  original: string,
  typed: string,
): {matched: boolean[]; wrong: boolean[]; typedDiverged: boolean[]} {
  const matched = new Array(original.length).fill(false);
  const wrong = new Array(original.length).fill(false);
  const typedDiverged = new Array(typed.length).fill(false);
  const NON_WS_LOOKAHEAD = 5;
  const isWs = (c: string) => c === " " || c === "\t" || c === "\n" || c === "\r";

  let oi = 0;
  let ti = 0;
  while (ti < typed.length && oi < original.length) {
    if (typed[ti] === original[oi]) {
      matched[oi++] = true;
      ti++;
      continue;
    }

    // Look ahead in original for typed[ti]. Whitespace is "free" — only
    // non-whitespace chars consume the lookahead budget.
    let skipOrig = -1;
    {
      let nonWs = 0;
      for (let k = 1; oi + k < original.length; k++) {
        const c = original[oi + k];
        if (c === typed[ti]) {
          skipOrig = k;
          break;
        }
        if (!isWs(c)) {
          nonWs++;
          if (nonWs > NON_WS_LOOKAHEAD) break;
        }
      }
    }

    let skipTyped = -1;
    {
      let nonWs = 0;
      for (let k = 1; ti + k < typed.length; k++) {
        const c = typed[ti + k];
        if (c === original[oi]) {
          skipTyped = k;
          break;
        }
        if (!isWs(c)) {
          nonWs++;
          if (nonWs > NON_WS_LOOKAHEAD) break;
        }
      }
    }

    // Prefer the smaller skip. On ties, prefer skipTyped (treat typed as
    // having an insertion) — that leaves original chars a chance to match.
    if (skipOrig !== -1 && skipTyped !== -1) {
      if (skipOrig < skipTyped) {
        for (let k = 0; k < skipOrig; k++) wrong[oi + k] = true;
        oi += skipOrig;
      } else {
        for (let k = 0; k < skipTyped; k++) typedDiverged[ti + k] = true;
        ti += skipTyped;
      }
    } else if (skipOrig !== -1) {
      for (let k = 0; k < skipOrig; k++) wrong[oi + k] = true;
      oi += skipOrig;
    } else if (skipTyped !== -1) {
      for (let k = 0; k < skipTyped; k++) typedDiverged[ti + k] = true;
      ti += skipTyped;
    } else {
      wrong[oi++] = true;
      typedDiverged[ti] = true;
      ti++;
    }
  }

  return {matched, wrong, typedDiverged};
}

// Simple syntax highlighting (without divergence info)
function highlightCode(code: string): string {
  return (
    code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /(["'`])(?:(?!\1|\\).|\\.)*\1/g,
        '<span style="color:#a5d6ff">$&</span>',
      )
      .replace(/(\/\/.*$)/gm, '<span style="color:#6a737d">$&</span>')
      .replace(
        /\b(function|const|let|var|if|else|for|while|return|new|class|import|export|from|default|true|false|null|undefined|this|void|typeof)\b/g,
        '<span style="color:#ff7b72">$&</span>',
      )
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#79c0ff">$&</span>')
      .replace(
        /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        '<span style="color:#d2a8ff">$1</span>(',
      )
  );
}

// Highlight with wobble on diverged characters
function highlightWithDivergence(code: string, diverged: boolean[]): string {
  // First apply syntax highlighting on raw code
  const highlighted = highlightCode(code);

  // Then wrap diverged characters with wobble spans
  // We need to map original char positions through the HTML tags
  let origIdx = 0;
  let result = "";
  let inTag = false;

  for (let i = 0; i < highlighted.length; i++) {
    const ch = highlighted[i];

    if (ch === "<") {
      inTag = true;
      result += ch;
      continue;
    }
    if (ch === ">") {
      inTag = false;
      result += ch;
      continue;
    }
    if (inTag) {
      result += ch;
      continue;
    }

    // Decode HTML entities to count original chars
    let entityLen = 0;
    if (highlighted.slice(i).startsWith("&amp;")) entityLen = 5;
    else if (highlighted.slice(i).startsWith("&lt;")) entityLen = 4;
    else if (highlighted.slice(i).startsWith("&gt;")) entityLen = 4;

    if (entityLen > 0) {
      const entity = highlighted.slice(i, i + entityLen);
      if (diverged[origIdx] && code[origIdx] !== "\n") {
        result += `<span style="display:inline-block;animation:wobble 0.8s ease-in-out infinite;animation-delay:${(origIdx * 0.05) % 2}s">${entity}</span>`;
      } else {
        result += entity;
      }
      origIdx++;
      i += entityLen - 1;
      continue;
    }

    // Regular character
    if (diverged[origIdx] && code[origIdx] !== "\n") {
      result += `<span style="display:inline-block;animation:wobble 0.8s ease-in-out infinite;animation-delay:${(origIdx * 0.05) % 2}s">${ch}</span>`;
    } else {
      result += ch;
    }
    origIdx++;
  }

  return result;
}

interface Step {
  title: string;
  description: string;
  files: Record<string, string>;
}

interface StepsData {
  id: string;
  title: string;
  steps: Step[];
}

export default function TraceClient() {
  const [originalCode, setOriginalCode] = useState("");
  const [isTracing, setIsTracing] = useState(false);
  const [typed, setTyped] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [navigatedToDiary, setNavigatedToDiary] = useState(false);

  // Step mode
  const [stepsData, setStepsData] = useState<StepsData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Multi-file support
  const [activeFile, setActiveFile] = useState("sketch.js");
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [previewKey, setPreviewKey] = useState(0);

  // Get list of files for current step
  const currentFiles = useMemo(() => {
    if (stepsData && stepsData.steps[currentStep]?.files) {
      return Object.keys(stepsData.steps[currentStep].files);
    }
    return ["sketch.js"];
  }, [stepsData, currentStep]);

  // Flush save immediately (used at step transitions and on completion so the
  // last phase always lands on disk before we navigate away).
  const sketchDate = searchParams.get("date");
  const flushSave = useCallback(
    (filename: string, content: string) => {
      if (!sketchDate || !content || process.env.NODE_ENV !== "development") return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      return fetch("/api/save-sketch", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({date: sketchDate, filename, content}),
      }).catch(() => {});
    },
    [sketchDate],
  );

  // Switch active file: save current typed, restore new file's typed
  const switchFile = useCallback((filename: string) => {
    // Save current to memory and flush to disk so the file we're leaving is
    // durably recorded — otherwise its latest content lives only in `typed`
    // and gets overwritten when we restore the target's typed below.
    setFileContents(prev => ({...prev, [activeFile]: typed}));
    flushSave(activeFile, typed);
    // Restore target
    const savedTyped = fileContents[filename] || "";
    setTyped(savedTyped);
    // Update originalCode for the new file
    if (stepsData && stepsData.steps[currentStep]?.files?.[filename]) {
      setOriginalCode(stepsData.steps[currentStep].files[filename]);
    }
    setActiveFile(filename);
    setCursorPos(savedTyped.length);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [activeFile, typed, fileContents, stepsData, currentStep, flushSave]);

  // Auto-save (debounced, dev only)
  useEffect(() => {
    if (!sketchDate || !typed || process.env.NODE_ENV !== "development") return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch("/api/save-sketch", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({date: sketchDate, filename: activeFile, content: typed}),
      }).catch(() => {});
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [typed, sketchDate, activeFile]);

  // Multi-file preview: when preview is open, flush every known file to disk
  // (so loadShader/loadFont can resolve relative paths), then bump previewKey
  // to reload the iframe. Debounced so we don't thrash on every keystroke.
  const multiFile = currentFiles.length > 1;
  useEffect(() => {
    if (!sketchDate || !showPreview || !multiFile) return;
    if (process.env.NODE_ENV !== "development") return;
    const t = setTimeout(async () => {
      const snapshot: Record<string, string> = {...fileContents, [activeFile]: typed};
      const stepFiles = stepsData?.steps[currentStep]?.files ?? {};
      // For files the user hasn't touched yet, seed them from the step's
      // expected content so the preview actually runs end-to-end.
      for (const name of Object.keys(stepFiles)) {
        if (!(name in snapshot) || snapshot[name] === "") {
          snapshot[name] = stepFiles[name];
        }
      }
      await Promise.all(
        Object.entries(snapshot).map(([filename, content]) =>
          flushSave(filename, content),
        ),
      );
      setPreviewKey((k) => k + 1);
    }, 800);
    return () => clearTimeout(t);
  }, [
    typed,
    fileContents,
    activeFile,
    sketchDate,
    showPreview,
    multiFile,
    stepsData,
    currentStep,
    flushSave,
  ]);

  // Auto-load steps from URL query parameter
  useEffect(() => {
    const stepsUrl = searchParams.get("steps");
    const codeUrl = searchParams.get("code");
    const dateParam = searchParams.get("date");

    // Read previously-typed content from disk so reopening a half-finished
    // trace picks up where the user left off instead of starting from scratch.
    const restoreFromDisk = async (filenames: string[]) => {
      if (!dateParam) return {} as Record<string, string>;
      const restored: Record<string, string> = {};
      await Promise.all(
        filenames.map(async (filename) => {
          try {
            const r = await fetch(
              `/sketches/${dateParam}/${filename}?_=${Date.now()}`,
            );
            if (r.ok) restored[filename] = await r.text();
          } catch {}
        }),
      );
      return restored;
    };

    if (stepsUrl) {
      fetch(stepsUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
          return res.json();
        })
        .then(async (data: StepsData) => {
          setStepsData(data);
          setCurrentStep(0);
          const files = data.steps[0]?.files || {};
          const filenames = Object.keys(files);
          const firstFileName = filenames[0] || "sketch.js";
          const firstCode = files[firstFileName] || "";

          const restored = await restoreFromDisk(filenames);
          setFileContents(restored);
          setActiveFile(firstFileName);
          setOriginalCode(firstCode);
          if (restored[firstFileName] != null) {
            setTyped(restored[firstFileName]);
            setCursorPos(restored[firstFileName].length);
          }
          setTimeout(() => {
            setIsTracing(true);
            setTimeout(() => textareaRef.current?.focus(), 100);
          }, 50);
        })
        .catch((err) => console.error("Steps load error:", err));
      return;
    }

    if (codeUrl) {
      fetch(codeUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
          return res.text();
        })
        .then(async (text) => {
          if (text && text.trim()) {
            setOriginalCode(text);
            const restored = await restoreFromDisk(["sketch.js"]);
            if (restored["sketch.js"] != null) {
              setTyped(restored["sketch.js"]);
              setCursorPos(restored["sketch.js"].length);
            }
            setTimeout(() => {
              setIsTracing(true);
              setTimeout(() => textareaRef.current?.focus(), 100);
            }, 50);
          }
        })
        .catch((err) => console.error("Code load error:", err));
    }
  }, [searchParams]);

  const startTracing = useCallback(() => {
    if (!originalCode.trim()) return;
    setIsTracing(true);
    setTyped("");
    setCursorPos(0);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [originalCode]);

  const goToStep = useCallback((stepIdx: number) => {
    if (!stepsData || stepIdx < 0 || stepIdx >= stepsData.steps.length) return;
    // Save current file's typed content (memory) and flush to disk so the
    // step we're leaving is durably recorded before originalCode swaps out.
    setFileContents(prev => ({...prev, [activeFile]: typed}));
    flushSave(activeFile, typed);
    setCurrentStep(stepIdx);
    const files = stepsData.steps[stepIdx]?.files || {};
    const code = files[activeFile] || files[Object.keys(files)[0]] || "";
    setOriginalCode(code);
    // Keep typed text
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [stepsData, activeFile, typed, flushSave]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTyped(value);
      setCursorPos(value.length);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      // Tab key inserts 2 spaces
      if (e.key === "Tab") {
        e.preventDefault();
        const newVal = typed.slice(0, start) + "  " + typed.slice(end);
        setTyped(newVal);
        setCursorPos(start + 2);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        }, 0);
      }

      // Enter key: auto-indent (carry over leading whitespace from current line)
      if (e.key === "Enter") {
        e.preventDefault();
        const before = typed.slice(0, start);
        const after = typed.slice(end);
        const lastLine = before.split("\n").pop() || "";
        const indent = lastLine.match(/^(\s*)/)?.[1] || "";
        const newVal = before + "\n" + indent + after;
        const newPos = start + 1 + indent.length;
        setTyped(newVal);
        setCursorPos(newPos);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = newPos;
        }, 0);
      }
    },
    [typed],
  );

  // Sync scroll between layers
  const ghostRef = useRef<HTMLPreElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const handleScroll = useCallback(() => {
    if (!textareaRef.current) return;
    const top = textareaRef.current.scrollTop;
    const left = textareaRef.current.scrollLeft;
    const transform = `translate(${-left}px, ${-top}px)`;
    if (ghostRef.current) ghostRef.current.style.transform = transform;
    if (highlightRef.current) highlightRef.current.style.transform = transform;
  }, []);

  // Streaming alignment (memoized to avoid recompute on every render)
  const alignment = useMemo(
    () => alignTyped(originalCode, typed),
    [originalCode, typed],
  );

  // Calculate progress
  const matchCount = alignment.matched.filter(Boolean).length;
  const progress =
    originalCode.length > 0
      ? Math.round((matchCount / originalCode.length) * 100)
      : 0;

  // On completion of the final step, flush the save and slide into the diary.
  useEffect(() => {
    if (navigatedToDiary || !isTracing || !sketchDate) return;
    if (originalCode.length === 0 || progress < 100) return;
    const isLastStep =
      !stepsData || currentStep === stepsData.steps.length - 1;
    if (!isLastStep) return;

    const timer = setTimeout(async () => {
      setNavigatedToDiary(true);
      await flushSave(activeFile, typed);
      router.push(`/diary/${sketchDate}`);
    }, 800);
    return () => clearTimeout(timer);
  }, [
    progress,
    isTracing,
    sketchDate,
    stepsData,
    currentStep,
    originalCode.length,
    navigatedToDiary,
    activeFile,
    typed,
    flushSave,
    router,
  ]);

  // Build the ghost layer using alignment result
  const buildGhostHtml = () => {
    const lines: string[] = [];
    let currentLine = "";

    for (let i = 0; i < originalCode.length; i++) {
      const origChar = originalCode[i];

      if (origChar === "\n") {
        lines.push(currentLine);
        currentLine = "";
        continue;
      }

      const escaped = origChar
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      if (alignment.matched[i]) {
        currentLine += `<span style="color:rgba(120,220,120,0.55)">${escaped}</span>`;
      } else if (alignment.wrong[i]) {
        currentLine += `<span style="color:rgba(200,200,200,0.45)">${escaped}</span>`;
      } else {
        // Not yet reached / not aligned to anything
        currentLine += `<span style="color:rgba(210,210,210,0.7)">${escaped}</span>`;
      }
    }
    lines.push(currentLine);
    return lines.join("\n");
  };

  const wobbleStyle = `
    @keyframes wobble {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-2px); }
      75% { transform: translateY(2px); }
    }
  `;

  if (!isTracing || !originalCode) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-300 flex flex-col items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <p
            className="text-xs text-gray-500 mb-4"
            style={{fontFamily: "ui-monospace, monospace"}}
          >
            Paste code below, then trace over it by typing.
          </p>
          <textarea
            value={originalCode}
            onChange={(e) => setOriginalCode(e.target.value)}
            placeholder="Paste code here..."
            className="w-full h-64 bg-[#161b22] border border-[#30363d] rounded-md p-4 text-sm text-gray-300 resize-none focus:outline-none focus:border-[#58a6ff]"
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
            spellCheck={false}
          />
          <button
            onClick={startTracing}
            disabled={!originalCode.trim()}
            className="mt-4 px-6 py-2 bg-[#238636] text-white text-sm rounded-md hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-gray-600 transition-colors"
            style={{fontFamily: "ui-monospace, monospace"}}
          >
            Start Tracing
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: wobbleStyle }} />
      {/* Fixed background — stays put even when the page body scrolls */}
      <div className="fixed inset-0 bg-[#0d1117] -z-10" />
      <div className="h-screen bg-[#0d1117] text-gray-300 flex flex-col">
        {/* Header */}
      <div
        className="px-4 py-2 border-b border-[#30363d]"
        style={{fontFamily: "ui-monospace, monospace"}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {stepsData && (
              <span className="text-xs text-gray-400">
                Step {currentStep + 1}/{stepsData.steps.length}
              </span>
            )}
            <span className="text-xs text-gray-600">
              {progress}% ({matchCount}/{originalCode.length})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-32 bg-[#21262d] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#238636] transition-all duration-300"
                style={{width: `${progress}%`}}
              />
            </div>
            {stepsData && (
              <>
                <button
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={currentStep === 0}
                  className="text-xs text-gray-500 hover:text-gray-300 disabled:text-gray-700 transition-colors"
                >
                  ← prev
                </button>
                <button
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={currentStep === stepsData.steps.length - 1}
                  className="text-xs text-gray-500 hover:text-gray-300 disabled:text-gray-700 transition-colors"
                >
                  next →
                </button>
              </>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`text-xs transition-colors ${showPreview ? "text-[#58a6ff]" : "text-gray-500 hover:text-gray-300"}`}
            >
              {showPreview ? "▶ Preview" : "▷ Preview"}
            </button>
            <button
              onClick={() => {
                setIsTracing(false);
                setTyped("");
                setStepsData(null);
                setShowPreview(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Reset
            </button>
            {sketchDate && process.env.NODE_ENV === "development" && (
              <button
                onClick={async () => {
                  if (!confirm(`${sketchDate} の写経を中断し、ファイルとネットワーク状態を元に戻します。よろしいですか？`)) return;
                  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                  setNavigatedToDiary(true); // suppress completion auto-navigation
                  const res = await fetch("/api/discard-sketch", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({date: sketchDate}),
                  });
                  if (res.ok) {
                    router.push("/network");
                  } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.error || "中断に失敗しました");
                  }
                }}
                className="text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                中断
              </button>
            )}
          </div>
        </div>
        {/* Step description */}
        {stepsData && stepsData.steps[currentStep] && (
          <div className="mt-2 pb-1">
            <div className="text-xs text-[#58a6ff] font-bold mb-1">
              {stepsData.steps[currentStep].title}
            </div>
            <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
              {stepsData.steps[currentStep].description}
            </div>
          </div>
        )}
      </div>

      {/* File tabs */}
      {currentFiles.length > 1 && (
        <div
          className="flex border-b border-[#30363d] px-2"
          style={{fontFamily: "ui-monospace, monospace"}}
        >
          {currentFiles.map((f) => (
            <button
              key={f}
              onClick={() => switchFile(f)}
              className={`px-3 py-1.5 text-xs transition-colors border-b-2 ${
                f === activeFile
                  ? "text-gray-200 border-[#58a6ff]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Editor + Preview */}
      <div className="flex-1 flex">
      <div className={`relative bg-[#0d1117] ${showPreview ? "w-1/2" : "w-full"}`}>
        {/* Typing layer — this is the scroll master */}
        <textarea
          ref={textareaRef}
          value={typed}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-[#58a6ff] resize-none focus:outline-none overflow-auto z-10"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "13px",
            lineHeight: "1.6",
            tabSize: 2,
            caretColor: "#58a6ff",
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
        />

        {/* Ghost layer: original code as faint background */}
        <pre
          ref={ghostRef}
          className="absolute top-0 left-0 right-0 p-4 pointer-events-none whitespace-pre z-20"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "13px",
            lineHeight: "1.6",
            tabSize: 2,
            minHeight: "100%",
          }}
          dangerouslySetInnerHTML={{__html: buildGhostHtml()}}
        />

        {/* Typed text with syntax highlighting (visible layer) */}
        <pre
          ref={highlightRef}
          className="absolute top-0 left-0 right-0 p-4 pointer-events-none whitespace-pre z-20"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "13px",
            lineHeight: "1.6",
            tabSize: 2,
            minHeight: "100%",
          }}
          dangerouslySetInnerHTML={{__html: highlightWithDivergence(typed, alignment.typedDiverged)}}
        />
      </div>

      {/* Preview iframe */}
      {showPreview && (
        <div className="w-1/2 border-l border-[#30363d] bg-white">
          {multiFile && sketchDate ? (
            <iframe
              key={previewKey}
              src={`/sketches/${sketchDate}/index.html?k=${previewKey}`}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          ) : (
            <iframe
              srcDoc={`<!DOCTYPE html>
<html><head>
<style>body{margin:0;overflow:hidden;}canvas{display:block;}</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/p5.min.js"></script>
</head><body><script>${typed}</script></body></html>`}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          )}
        </div>
      )}
      </div>
      </div>
    </>
  );
}
