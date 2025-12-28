import {DiaryEntry} from "./types";

export const dummyDiaryEntries: DiaryEntry[] = [
  // December 2025
  {
    id: "1",
    date: "2025-12-27",
    content:
      "今日は新しいジェネレーティブアートのプロジェクトを始めました。\nパーティクルシステムを使って、有機的な動きを表現することに挑戦しました。\np5.jsのノイズ関数を活用することで、より自然な動きを実現できました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "2",
    date: "2025-12-20",
    content:
      "Perlinノイズを使ったフローフィールドの実験。パーティクルが自然に流れる様子を観察しました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "3",
    date: "2025-12-15",
    content:
      "再帰的なアルゴリズムで樹木構造を生成。自然界のフラクタルパターンを表現しました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "4",
    date: "2025-12-05",
    content:
      "スピログラフのような幾何学模様を生成。数学的な美しさに魅了されました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  // November 2025
  {
    id: "5",
    date: "2025-11-28",
    content:
      "昨日のパーティクルシステムを改良しました。色のグラデーションと動きの速度にバリエーションを持たせることで、より深みのある表現になりました。\n次回は音との連動を試してみたいと思います。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "6",
    date: "2025-11-18",
    content:
      "円のパッキングアルゴリズムを実装。空間を効率的に埋める美しいパターンができました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "7",
    date: "2025-11-10",
    content:
      "グリッドを歪めるエフェクトを実験。マウスインタラクションで動的に変化させました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  // October 2025
  {
    id: "8",
    date: "2025-10-25",
    content:
      "幾何学的なパターンの生成に取り組みました。フラクタル的な構造を持つ図形を描画することで、複雑さと秩序が共存する美しいビジュアルを作ることができました。\n数学的な美しさとアートの融合を実感しています。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "9",
    date: "2025-10-15",
    content:
      "波の動きをシミュレートする実験。三角関数を組み合わせて、複雑な波のパターンを作成しました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "10",
    date: "2025-10-05",
    content:
      "カラフルな螺旋パターンを生成。回転と色相の変化を組み合わせて、サイケデリックな表現を試みました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  // September 2025
  {
    id: "11",
    date: "2025-09-22",
    content:
      "モーフィングする形状を実装。複数の図形間を滑らかに遷移させる技術を学びました。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
  {
    id: "12",
    date: "2025-09-10",
    content:
      "ボロノイ図を使った空間分割。ランダムな点から生成される有機的なパターンが美しいです。",
    p5jsSketchId: "_vFSFMvLj",
    thumbnailUrl:
      "https://lh3.googleusercontent.com/d/1Jyj_lF16d-kw5toqQBdNavpkicFYtQEy",
  },
];

// Sort entries by date in descending order (newest first)
const sortedEntries = [...dummyDiaryEntries].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export function getPreviousEntry(currentId: string): DiaryEntry | null {
  const currentIndex = sortedEntries.findIndex((e) => e.id === currentId);
  if (currentIndex === -1 || currentIndex === sortedEntries.length - 1) {
    return null;
  }
  return sortedEntries[currentIndex + 1];
}

export function getNextEntry(currentId: string): DiaryEntry | null {
  const currentIndex = sortedEntries.findIndex((e) => e.id === currentId);
  if (currentIndex === -1 || currentIndex === 0) {
    return null;
  }
  return sortedEntries[currentIndex - 1];
}
