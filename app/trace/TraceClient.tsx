"use client";

import {useState, useRef, useEffect, useCallback, useMemo} from "react";
import {useSearchParams} from "next/navigation";

// Forward streaming alignment with whitespace-tolerant lookahead.
// Whitespace runs don't count toward the lookahead budget, so indent/newline
// differences can be absorbed without painting the rest of the file red.
// Tie-breaks prefer treating extra typed chars as insertions over marking
// original chars as deletions.
function alignTyped(
  original: string,
  typed: string,
): {matched: boolean[]; wrong: boolean[]} {
  const matched = new Array(original.length).fill(false);
  const wrong = new Array(original.length).fill(false);
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
        ti += skipTyped;
      }
    } else if (skipOrig !== -1) {
      for (let k = 0; k < skipOrig; k++) wrong[oi + k] = true;
      oi += skipOrig;
    } else if (skipTyped !== -1) {
      ti += skipTyped;
    } else {
      wrong[oi++] = true;
      ti++;
    }
  }

  return {matched, wrong};
}

// Simple syntax highlighting
function highlightCode(code: string): string {
  return (
    code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // strings
      .replace(
        /(["'`])(?:(?!\1|\\).|\\.)*\1/g,
        '<span style="color:#a5d6ff">$&</span>',
      )
      // comments
      .replace(/(\/\/.*$)/gm, '<span style="color:#6a737d">$&</span>')
      // keywords
      .replace(
        /\b(function|const|let|var|if|else|for|while|return|new|class|import|export|from|default|true|false|null|undefined|this|void|typeof)\b/g,
        '<span style="color:#ff7b72">$&</span>',
      )
      // numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#79c0ff">$&</span>')
      // functions
      .replace(
        /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        '<span style="color:#d2a8ff">$1</span>(',
      )
  );
}

export default function TraceClient() {
  const [originalCode, setOriginalCode] = useState("");
  const [isTracing, setIsTracing] = useState(false);
  const [typed, setTyped] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const searchParams = useSearchParams();

  // Auto-load code from URL query parameter
  useEffect(() => {
    const codeUrl = searchParams.get("code");
    if (codeUrl) {
      fetch(codeUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
          return res.text();
        })
        .then((text) => {
          if (text && text.trim()) {
            setOriginalCode(text);
            // Delay entering trace mode to ensure originalCode is set
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
        currentLine += `<span style="color:rgba(100,200,100,0.5)">${escaped}</span>`;
      } else if (alignment.wrong[i]) {
        currentLine += `<span style="color:rgba(255,100,100,0.6);text-decoration:underline">${escaped}</span>`;
      } else {
        // Not yet reached / not aligned to anything
        currentLine += `<span style="color:rgba(150,150,150,0.25)">${escaped}</span>`;
      }
    }
    lines.push(currentLine);
    return lines.join("\n");
  };

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
      {/* Fixed background — stays put even when the page body scrolls */}
      <div className="fixed inset-0 bg-[#0d1117] -z-10" />
      <div className="h-screen bg-[#0d1117] text-gray-300 flex flex-col">
        {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]"
        style={{fontFamily: "ui-monospace, monospace"}}
      >
        <div className="flex items-center gap-4">
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
      <div className="flex-1 relative bg-[#0d1117]">
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
          dangerouslySetInnerHTML={{__html: highlightCode(typed)}}
        />
      </div>
      </div>
    </>
  );
}
