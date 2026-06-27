"use client";

import {useState} from "react";
import {
  CURATED_LIBS,
  addScript,
  hasScript,
  listExternalScripts,
  removeScript,
} from "@/lib/editor/libraries";

interface Props {
  files: string[];
  activeFile: string;
  entry: string;
  onSelect: (name: string) => void;
  onAddFile: (name: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDeleteFile: (name: string) => void;
  indexHtml: string;
  onIndexHtmlChange: (html: string) => void;
}

export default function Sidebar({
  files,
  activeFile,
  entry,
  onSelect,
  onAddFile,
  onRenameFile,
  onDeleteFile,
  indexHtml,
  onIndexHtmlChange,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [showLibs, setShowLibs] = useState(true);

  const commitAdd = () => {
    const name = newName.trim();
    if (name) onAddFile(name);
    setNewName("");
    setAdding(false);
  };

  const externalScripts = listExternalScripts(indexHtml);

  return (
    <div
      className="flex h-full w-48 flex-col overflow-y-auto border-r border-[#30363d] bg-[#0d1117] text-gray-300"
      style={{fontFamily: "ui-monospace, monospace"}}
    >
      {/* Files */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
        <span>FILES</span>
        <button
          onClick={() => setAdding((a) => !a)}
          className="text-gray-400 hover:text-gray-100"
          title="New file"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="px-2 pb-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setNewName("");
                setAdding(false);
              }
            }}
            onBlur={commitAdd}
            placeholder="name.js / .frag …"
            className="w-full rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-gray-200 focus:border-[#58a6ff] focus:outline-none"
          />
        </div>
      )}

      <div className="flex-1">
        {files.map((f) => (
          <div
            key={f}
            className={`group flex items-center justify-between px-3 py-1 text-xs ${
              f === activeFile
                ? "bg-[#161b22] text-gray-100"
                : "text-gray-400 hover:bg-[#161b22]/50"
            }`}
          >
            <button
              onClick={() => onSelect(f)}
              onDoubleClick={() => {
                const next = window.prompt("Rename file", f);
                if (next && next.trim() && next !== f) onRenameFile(f, next.trim());
              }}
              className="flex-1 truncate text-left"
              title={f}
            >
              {f}
            </button>
            {f !== entry && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${f}?`)) onDeleteFile(f);
                }}
                className="ml-1 hidden text-gray-600 hover:text-[#f85149] group-hover:block"
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Libraries */}
      <div className="border-t border-[#30363d]">
        <button
          onClick={() => setShowLibs((s) => !s)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs text-gray-500 hover:text-gray-300"
        >
          <span>LIBRARIES</span>
          <span>{showLibs ? "▾" : "▸"}</span>
        </button>
        {showLibs && (
          <div className="px-3 pb-3">
            {CURATED_LIBS.map((lib) => {
              const on = hasScript(indexHtml, lib.url);
              return (
                <label
                  key={lib.url}
                  className="flex cursor-pointer items-center gap-2 py-0.5 text-xs text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      onIndexHtmlChange(
                        on
                          ? removeScript(indexHtml, lib.url)
                          : addScript(indexHtml, lib.url),
                      )
                    }
                  />
                  {lib.name}
                </label>
              );
            })}

            {/* Custom / other external scripts present */}
            {externalScripts
              .filter((u) => !CURATED_LIBS.some((l) => l.url === u))
              .map((u) => (
                <div
                  key={u}
                  className="group flex items-center justify-between gap-1 py-0.5 text-xs text-gray-500"
                >
                  <span className="truncate" title={u}>
                    {u.replace(/^https?:\/\//, "")}
                  </span>
                  <button
                    onClick={() => onIndexHtmlChange(removeScript(indexHtml, u))}
                    className="hidden text-gray-600 hover:text-[#f85149] group-hover:block"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}

            <div className="mt-2 flex gap-1">
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customUrl.trim()) {
                    onIndexHtmlChange(addScript(indexHtml, customUrl.trim()));
                    setCustomUrl("");
                  }
                }}
                placeholder="CDN url…"
                className="min-w-0 flex-1 rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-gray-200 focus:border-[#58a6ff] focus:outline-none"
              />
              <button
                onClick={() => {
                  if (customUrl.trim()) {
                    onIndexHtmlChange(addScript(indexHtml, customUrl.trim()));
                    setCustomUrl("");
                  }
                }}
                className="rounded bg-[#21262d] px-2 text-xs text-gray-300 hover:bg-[#30363d]"
              >
                add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
