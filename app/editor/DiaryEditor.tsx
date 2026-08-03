"use client";

// 日記編集用の CodeMirror エディタ。
// - Markdown ハイライト＋選択中の URL ペーストでリンク化（pasteURLAsLink）
// - 画像のペースト / ドロップ / ボタン挿入 → /api/upload-diary-image に保存し
//   ![](./images/…) を挿入（表示時に lib/data.ts が絶対パスへ書き換える）
// - `@` でスケッチ / スナップのメンション補完（@self / @YYYY-MM-DD /
//   @YYYY-MM-DD_N）。候補は /api/list-mentions から取得。

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import CodeMirror, {type ReactCodeMirrorRef} from "@uiw/react-codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Prec} from "@codemirror/state";
import {
  acceptCompletion,
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import {markdown} from "@codemirror/lang-markdown";
import {editorTheme} from "@/lib/editor/theme";

interface MentionSketch {
  date: string;
  snaps: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  // この日記の日付（@self の説明・画像アップロード先ディレクトリ）
  date: string;
}

export default function DiaryEditor({value, onChange, date}: Props) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // 補完候補は ref に持ち、source 関数（＝extension）を安定させる。
  const sketchesRef = useRef<MentionSketch[]>([]);
  useEffect(() => {
    fetch("/api/list-mentions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.sketches)) sketchesRef.current = data.sketches;
      })
      .catch(() => {});
  }, []);

  const mentionCompletions = useCallback(
    (ctx: CompletionContext): CompletionResult | null => {
      const word = ctx.matchBefore(/@[\w-]*/);
      if (!word || (word.from === word.to && !ctx.explicit)) return null;
      const options: Completion[] = [
        {label: "@self", type: "keyword", detail: "この日のスケッチ", boost: 2},
      ];
      for (const s of sketchesRef.current) {
        options.push({label: `@${s.date}`, type: "constant", detail: "スケッチ"});
        for (let i = 1; i <= s.snaps; i++) {
          options.push({
            label: `@${s.date}_${i}`,
            type: "text",
            detail: `スナップ ${i}`,
          });
        }
      }
      return {from: word.from, options, validFor: /^@[\w-]*$/};
    },
    [],
  );

  const insertAtCursor = useCallback((text: string) => {
    const view = cmRef.current?.view;
    if (!view) return;
    view.dispatch(view.state.replaceSelection(text));
    view.focus();
  }, []);

  const uploadImage = useCallback(
    async (file: File) => {
      setMsg("画像を保存中…");
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        const res = await fetch("/api/upload-diary-image", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({date, name: file.name, dataUrl}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "failed");
        insertAtCursor(`![](${data.src})\n`);
        setMsg(null);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "failed");
        setTimeout(() => setMsg(null), 4000);
      }
    },
    [date, insertAtCursor],
  );

  // ペースト / ドロップされた画像をアップロードして挿入。
  const imageHandlers = useMemo(
    () =>
      EditorView.domEventHandlers({
        paste: (event) => {
          const files = Array.from(event.clipboardData?.files ?? []).filter(
            (f) => f.type.startsWith("image/"),
          );
          if (!files.length) return false;
          event.preventDefault();
          files.forEach((f) => void uploadImage(f));
          return true;
        },
        drop: (event) => {
          const files = Array.from(event.dataTransfer?.files ?? []).filter(
            (f) => f.type.startsWith("image/"),
          );
          if (!files.length) return false;
          event.preventDefault();
          files.forEach((f) => void uploadImage(f));
          return true;
        },
      }),
    [uploadImage],
  );

  const extensions = useMemo(
    () => [
      // 選択中に URL をペーストすると [選択テキスト](URL) になる
      markdown({pasteURLAsLink: true}),
      EditorView.lineWrapping,
      autocompletion({override: [mentionCompletions]}),
      Prec.highest(keymap.of([{key: "Tab", run: acceptCompletion}])),
      imageHandlers,
    ],
    [mentionCompletions, imageHandlers],
  );

  // 選択範囲をリンク化（未選択ならプレースホルダ挿入）。URL 部分を選択状態に
  // しておくので、そのままペースト / タイプで置き換えられる。
  const insertLink = useCallback(() => {
    const view = cmRef.current?.view;
    if (!view) return;
    const {from, to} = view.state.selection.main;
    const text = view.state.sliceDoc(from, to) || "リンクテキスト";
    const url = "https://";
    const urlStart = from + text.length + 3; // "[" + text + "]("
    view.dispatch({
      changes: {from, to, insert: `[${text}](${url})`},
      selection: {anchor: urlStart, head: urlStart + url.length},
    });
    view.focus();
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center gap-3 border-b border-[#30363d] px-3 py-1"
        style={{fontFamily: "ui-monospace, monospace"}}
      >
        <button
          onClick={() => fileRef.current?.click()}
          className="text-[10px] text-gray-500 hover:text-gray-300"
          title="画像を挿入（ペースト / ドロップでも可）"
        >
          画像
        </button>
        <button
          onClick={insertLink}
          className="text-[10px] text-gray-500 hover:text-gray-300"
          title="リンクを挿入（URL 選択ペーストでも可）"
        >
          リンク
        </button>
        <span className="text-[10px] text-gray-700">
          @ でスケッチ / スナップをメンション（@self = この日）
        </span>
        {msg && <span className="text-[10px] text-gray-500">{msg}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          ref={cmRef}
          value={value}
          onChange={onChange}
          theme={editorTheme}
          extensions={extensions}
          placeholder="この日のスケッチについて（Markdown）…"
          height="100%"
          style={{height: "100%"}}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            autocompletion: false, // 自前の autocompletion({override}) を使う
            tabSize: 2,
          }}
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadImage(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
