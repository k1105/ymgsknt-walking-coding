// Map a filename to its CodeMirror 6 language extension.
import type {Extension} from "@codemirror/state";
import {javascript, javascriptLanguage} from "@codemirror/lang-javascript";
import {css} from "@codemirror/lang-css";
import {html} from "@codemirror/lang-html";
import {json} from "@codemirror/lang-json";
import {glsl} from "codemirror-lang-glsl";
import {langOf} from "./vfs";
import {p5CompletionSource} from "./p5-completions";

export function languageExtension(filename: string): Extension[] {
  switch (langOf(filename)) {
    case "js":
      // Augment (not replace) JS completions with p5 globals.
      return [
        javascript(),
        javascriptLanguage.data.of({autocomplete: p5CompletionSource}),
      ];
    case "css":
      return [css()];
    case "html":
      return [html()];
    case "json":
      return [json()];
    case "glsl":
      return [glsl()];
    default:
      return [];
  }
}
