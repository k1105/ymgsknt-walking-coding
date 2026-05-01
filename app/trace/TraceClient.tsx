"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Simple syntax highlighting
function highlightCode(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // strings
    .replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '<span style="color:#a5d6ff">$&</span>')
    // comments
    .replace(/(\/\/.*$)/gm, '<span style="color:#6a737d">$&</span>')
    // keywords
    .replace(/\b(function|const|let|var|if|else|for|while|return|new|class|import|export|from|default|true|false|null|undefined|this|void|typeof)\b/g, '<span style="color:#ff7b72">$&</span>')
    // numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#79c0ff">$&</span>')
    // functions
    .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span style="color:#d2a8ff">$1</span>(');
}

export default function TraceClient() {
  const [originalCode, setOriginalCode] = useState("");
  const [isTracing, setIsTracing] = useState(false);
  const [typed, setTyped] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const startTracing = useCallback(() => {
    if (!originalCode.trim()) return;
    setIsTracing(true);
    setTyped("");
    setCursorPos(0);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [originalCode]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTyped(value);
      setCursorPos(value.length);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab key inserts 2 spaces
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newVal = typed.slice(0, start) + "  " + typed.slice(end);
        setTyped(newVal);
        setCursorPos(start + 2);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        }, 0);
      }
    },
    [typed]
  );

  // Sync scroll between layers
  const ghostRef = useRef<HTMLPreElement>(null);
  const handleScroll = useCallback(() => {
    if (textareaRef.current && ghostRef.current) {
      ghostRef.current.scrollTop = textareaRef.current.scrollTop;
      ghostRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Calculate progress
  const matchCount = typed.split("").filter((c, i) => originalCode[i] === c).length;
  const progress = originalCode.length > 0 ? Math.round((matchCount / originalCode.length) * 100) : 0;

  // Build the ghost layer: matched chars are dim, unmatched original chars are very faint
  const buildGhostHtml = () => {
    const lines: string[] = [];
    let currentLine = "";

    for (let i = 0; i < originalCode.length; i++) {
      const origChar = originalCode[i];
      const typedChar = typed[i];

      if (origChar === "\n") {
        lines.push(currentLine);
        currentLine = "";
        continue;
      }

      const escaped = origChar
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      if (i < typed.length) {
        if (typedChar === origChar) {
          // Matched — show as confirmed (green-ish)
          currentLine += `<span style="color:rgba(100,200,100,0.5)">${escaped}</span>`;
        } else {
          // Wrong character — show original in red
          currentLine += `<span style="color:rgba(255,100,100,0.6);text-decoration:underline">${escaped}</span>`;
        }
      } else {
        // Not yet typed — faint ghost
        currentLine += `<span style="color:rgba(150,150,150,0.25)">${escaped}</span>`;
      }
    }
    lines.push(currentLine);
    return lines.join("\n");
  };

  if (!isTracing) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-300 flex flex-col items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <h1
            className="text-sm uppercase tracking-widest text-gray-500 mb-6"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            Trace Editor
          </h1>
          <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: "ui-monospace, monospace" }}>
            Paste code below, then trace over it by typing.
          </p>
          <textarea
            value={originalCode}
            onChange={(e) => setOriginalCode(e.target.value)}
            placeholder="Paste code here..."
            className="w-full h-64 bg-[#161b22] border border-[#30363d] rounded-md p-4 text-sm text-gray-300 resize-none focus:outline-none focus:border-[#58a6ff]"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            spellCheck={false}
          />
          <button
            onClick={startTracing}
            disabled={!originalCode.trim()}
            className="mt-4 px-6 py-2 bg-[#238636] text-white text-sm rounded-md hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-gray-600 transition-colors"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            Start Tracing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            Trace Editor
          </span>
          <span className="text-xs text-gray-600">
            {progress}% ({matchCount}/{originalCode.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="h-1 w-32 bg-[#21262d] rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#238636] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={() => {
              setIsTracing(false);
              setTyped("");
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        {/* Ghost layer: original code as faint background */}
        <pre
          ref={ghostRef}
          className="absolute inset-0 p-4 overflow-auto pointer-events-none whitespace-pre"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "13px",
            lineHeight: "1.6",
            tabSize: 2,
          }}
          dangerouslySetInnerHTML={{ __html: buildGhostHtml() }}
        />

        {/* Typing layer */}
        <textarea
          ref={textareaRef}
          value={typed}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-[#58a6ff] resize-none focus:outline-none"
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

        {/* Typed text with syntax highlighting (visible layer) */}
        <pre
          className="absolute inset-0 p-4 overflow-auto pointer-events-none whitespace-pre"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "13px",
            lineHeight: "1.6",
            tabSize: 2,
          }}
          dangerouslySetInnerHTML={{ __html: highlightCode(typed) }}
        />
      </div>
    </div>
  );
}
