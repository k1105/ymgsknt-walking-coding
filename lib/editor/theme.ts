// A dark CodeMirror theme matching the app's GitHub-dark palette (#0d1117),
// reusing one-dark's syntax highlight colors for the tokens themselves.
import {EditorView} from "@codemirror/view";
import {syntaxHighlighting} from "@codemirror/language";
import {oneDarkHighlightStyle} from "@codemirror/theme-one-dark";
import type {Extension} from "@codemirror/state";

const base = EditorView.theme(
  {
    "&": {
      color: "#c9d1d9",
      backgroundColor: "#0d1117",
      fontSize: "13px",
      height: "100%",
    },
    ".cm-content": {
      caretColor: "#58a6ff",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    ".cm-cursor, .cm-dropCursor": {borderLeftColor: "#58a6ff"},
    "&.cm-focused": {outline: "none"},
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {backgroundColor: "#264f78"},
    ".cm-gutters": {
      backgroundColor: "#0d1117",
      color: "#484f58",
      border: "none",
    },
    ".cm-activeLineGutter": {backgroundColor: "#161b22", color: "#8b949e"},
    ".cm-activeLine": {backgroundColor: "rgba(110,118,129,0.1)"},
    ".cm-lineNumbers .cm-gutterElement": {padding: "0 8px 0 12px"},
    ".cm-foldPlaceholder": {
      backgroundColor: "#21262d",
      border: "none",
      color: "#8b949e",
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "rgba(88,166,255,0.25)",
      outline: "none",
    },
    ".cm-tooltip": {
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      color: "#c9d1d9",
    },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "#1f6feb",
      color: "#fff",
    },
  },
  {dark: true},
);

export const editorTheme: Extension = [
  base,
  syntaxHighlighting(oneDarkHighlightStyle),
];
