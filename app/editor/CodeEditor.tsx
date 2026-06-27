"use client";

import {useMemo} from "react";
import CodeMirror from "@uiw/react-codemirror";
import {EditorView} from "@codemirror/view";
import {languageExtension} from "@/lib/editor/languages";
import {editorTheme} from "@/lib/editor/theme";
import {traceExtension} from "@/lib/editor/trace";

interface Props {
  filename: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  // When set, the editor runs in trace (写経) mode: `value` is what the user
  // types and `traceOriginal` is the target shown as ghost + divergence.
  traceOriginal?: string;
}

export default function CodeEditor({
  filename,
  value,
  onChange,
  readOnly,
  traceOriginal,
}: Props) {
  const extensions = useMemo(() => {
    const exts = [...languageExtension(filename), EditorView.lineWrapping];
    if (traceOriginal !== undefined) exts.push(traceExtension(traceOriginal));
    return exts;
  }, [filename, traceOriginal]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={editorTheme}
      extensions={extensions}
      readOnly={readOnly}
      height="100%"
      style={{height: "100%"}}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        indentOnInput: true,
        tabSize: 2,
      }}
    />
  );
}
