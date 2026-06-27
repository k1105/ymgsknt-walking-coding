// CodeMirror 6 trace (写経) decorations.
//
// The document is what the user types. Against a target `original`, we:
//   - wobble + underline diverged typed chars (cm-trace-wrong)
//   - render the not-yet-typed remainder of the original as faint ghost text
//     at the end of the document (cm-trace-ghost), so the user sees what's next
//
// This is the CM6-native replacement for the textarea+overlay approach in
// TraceClient — no fragile char-aligned background layer.

import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import {StateEffect, StateField, RangeSetBuilder} from "@codemirror/state";
import type {Extension} from "@codemirror/state";
import {alignTyped, reachedOriginalIndex} from "./align";

// Update the trace target without remounting the editor:
//   view.dispatch({effects: setTraceOriginal.of(newOriginal)})
export const setTraceOriginal = StateEffect.define<string>();

const traceOriginalField = StateField.define<string>({
  create: () => "",
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setTraceOriginal)) return e.value;
    return value;
  },
});

class GhostWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  eq(other: GhostWidget) {
    return other.text === this.text;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-trace-ghost";
    span.textContent = this.text;
    return span;
  }
  ignoreEvent() {
    return true;
  }
}

const wrongMark = Decoration.mark({class: "cm-trace-wrong"});

function buildDecorations(view: EditorView): DecorationSet {
  const original = view.state.field(traceOriginalField);
  if (!original) return Decoration.none;
  const typed = view.state.doc.toString();
  const a = alignTyped(original, typed);

  const builder = new RangeSetBuilder<Decoration>();
  for (let i = 0; i < typed.length; i++) {
    if (a.typedDiverged[i]) builder.add(i, i + 1, wrongMark);
  }
  const remaining = original.slice(reachedOriginalIndex(a));
  if (remaining) {
    builder.add(
      typed.length,
      typed.length,
      Decoration.widget({widget: new GhostWidget(remaining), side: 1}),
    );
  }
  return builder.finish();
}

const tracePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      const originalChanged =
        update.startState.field(traceOriginalField) !==
        update.state.field(traceOriginalField);
      if (update.docChanged || originalChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {decorations: (v) => v.decorations},
);

const traceTheme = EditorView.theme({
  ".cm-trace-wrong": {
    color: "#f85149",
    textDecoration: "underline wavy #f85149",
    animation: "cm-trace-wobble 0.8s ease-in-out infinite",
    display: "inline-block",
  },
  ".cm-trace-ghost": {
    color: "rgba(139,148,158,0.45)",
    whiteSpace: "pre-wrap",
  },
});

// Public extension. Pass the initial original; update later via the
// setTraceOriginal effect.
export function traceExtension(original: string): Extension {
  return [
    traceOriginalField.init(() => original),
    tracePlugin,
    traceTheme,
  ];
}
