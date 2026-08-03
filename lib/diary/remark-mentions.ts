// remark-mentions.ts — diary の @メンション記法を内部リンクに変換する
// remark プラグイン。
//
//   @YYYY-MM-DD      … その日のスケッチ（/diary/YYYY-MM-DD）
//   @YYYY-MM-DD_N    … その日の N 番目のスナップ（/diary/YYYY-MM-DD?snap=N）
//   @self            … この日記自身の日付のエイリアス（@self_N も可）
//
// テキストノードだけを走査するので、コードブロック・インラインコード・
// 既存リンク内の @ は変換されない。生成するのは className "mention" 付きの
// link ノードで、MdxContent 側の `a` オーバーライドがチップ表示に使う。

const MENTION_RE = /@(self|\d{4}-\d{2}-\d{2})(_\d+)?(?!\w)/g;

interface MdNode {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
  data?: {hProperties?: Record<string, unknown>};
}

export interface RemarkMentionsOptions {
  // @self の解決先（この日記エントリの日付 YYYY-MM-DD）
  selfDate: string;
}

export function remarkMentions(options: RemarkMentionsOptions) {
  const selfDate = options.selfDate;

  function splitText(value: string): MdNode[] | null {
    const out: MdNode[] = [];
    let last = 0;
    for (const m of value.matchAll(MENTION_RE)) {
      const idx = m.index ?? 0;
      if (idx > last) out.push({type: "text", value: value.slice(last, idx)});
      const date = m[1] === "self" ? selfDate : m[1];
      const snap = m[2] ? parseInt(m[2].slice(1), 10) : null;
      out.push({
        type: "link",
        url: snap ? `/diary/${date}?snap=${snap}` : `/diary/${date}`,
        children: [{type: "text", value: m[0]}],
        data: {hProperties: {className: "mention"}},
      });
      last = idx + m[0].length;
    }
    if (last === 0) return null; // no mentions — keep the original node
    if (last < value.length) out.push({type: "text", value: value.slice(last)});
    return out;
  }

  function walk(node: MdNode) {
    if (!node.children) return;
    // リンク内・コード内は変換しない（code/inlineCode は children を持たない）
    if (node.type === "link" || node.type === "linkReference") return;
    const next: MdNode[] = [];
    for (const child of node.children) {
      if (child.type === "text" && typeof child.value === "string") {
        const parts = splitText(child.value);
        if (parts) {
          next.push(...parts);
          continue;
        }
      } else {
        walk(child);
      }
      next.push(child);
    }
    node.children = next;
  }

  return (tree: MdNode) => {
    walk(tree);
  };
}
