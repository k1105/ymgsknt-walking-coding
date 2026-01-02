"use client";

import {useEffect, useRef, useState, useMemo} from "react";
import {setupCanvas, drawRoughCurve} from "@/lib/canvas";

export default function StatementPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const text = "ステートメント";
  const chars = useMemo(() => text.split(""), []);
  const [charPositions, setCharPositions] = useState<
    Array<{char: string; x: number; y: number}>
  >([]);

  // Generate fixed positions for characters (center, vertical)
  useEffect(() => {
    const generatePositions = () => {
      if (typeof window === "undefined") return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const fontSize = 64; // 4rem = 64px
      const lineHeight = fontSize * 1.2; // 文字間の間隔
      const totalHeight = (chars.length - 1) * lineHeight; // 全体の高さ

      const positions: Array<{char: string; x: number; y: number}> = [];

      chars.forEach((char, index) => {
        // 画面中央から縦に固定配置
        const x = width / 2;
        const y = height / 2 - totalHeight / 2 + index * lineHeight;

        positions.push({
          char,
          x,
          y,
        });
      });

      setCharPositions(positions);
    };

    generatePositions();
    window.addEventListener("resize", generatePositions);
    return () => window.removeEventListener("resize", generatePositions);
  }, [chars]);

  // Draw connecting lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || charPositions.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const ctx = setupCanvas(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = "#8EC5FF";
    ctx.lineWidth = 1;

    for (let i = 0; i < charPositions.length - 1; i++) {
      const current = charPositions[i];
      const next = charPositions[i + 1];
      if (i === 0) ctx.moveTo(current.x, current.y);
      const seed = i * 0.1;
      drawRoughCurve(ctx, current.x, current.y, next.x, next.y, seed, 2);
    }

    ctx.stroke();
  }, [charPositions]);

  return (
    <div className="relative min-h-screen">
      {/* Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{zIndex: 0}}
      />

      {/* Background Text Characters */}
      <div className="fixed inset-0 pointer-events-none" style={{zIndex: 1}}>
        {charPositions.map((pos, i) => (
          <span
            key={i}
            className="absolute text-blue-300"
            style={{
              fontSize: "4rem",
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: "translate(-50%, -50%)",
              fontFamily: "var(--font-doto)",
              writingMode: "vertical-rl",
            }}
          >
            {pos.char}
          </span>
        ))}
      </div>

      {/* Content */}
      <main
        className="relative mx-auto max-w-4xl px-6 py-16"
        style={{zIndex: 2}}
      >
        <article className="prose prose-invert max-w-none">
          <div className="text-lg text-zinc-300 leading-relaxed space-y-6">
            <p>コードを書かなくなった。</p>
            <p>
              Cursor、Claude、Geminiを使い分けながら、大枠のレイアウトはIllustratorで組み、画像からレイアウトを起こしてもらう。「spring-layout」「convex
              hull」と言うだけでアルゴリズムが実装される。
            </p>
            <p>
              AIに依存するにつれて、コードが手元を離れていく。コードを理解していないから、些細なバグですらAIに「なんとかして」もらう場面が増えてくる。
            </p>
            <p>
              それでも、実はそれほど悲観していない。AIエージェントには、単なる代替を超えた価値があるからだ。
            </p>
            <p>
              AIエージェントが提案するコードの「スピード」は、人類が到達しうる最高速度を軽々と超えている。もしコーディングを、ある「目的」を果たすための「道のり」だと見立てるなら、AIエージェントはさながらスポーツカーだろう。徒歩で辿り着ける距離と、車で辿り着ける距離は次元が違う。同じ時間の中で何度も往復することも、これまでよりはるかに遠くを目指すことも可能になる。
            </p>
            <p>
              この変化によって、「作り方」に向けていた意識の比重が下がり、「何を作るか」への関心が一気に高まった。ある意味では、思考は以前よりもクリアになったと感じている。
            </p>
            <p>
              しかし皮肉なことに、「何を作るか」という発想は、たいてい「いかに作るか」を考えている最中に生まれてきたものでもある。
            </p>
            <p>
              コーディングの途中で、この変数をあえて大きくしたらどうなるだろうか、とか、ここで脇道に逸れたら何が起こるだろうか、といったことを考える。そうした「寄り道」のような操作に、もっと期待してもいいのではないかと思うようになった。
            </p>
            <p>
              また、「コーディング」という行為に下支えされていなければ説明できないものが確かに存在する。それは印象や感覚といった言葉ではうまく言い表せない。そうしたものをプロンプトだけで実現しようとすると、結局はコーディングとほとんど変わらない粒度の説明を要求されることになる。
            </p>
            <p>
              だから、「walking」する。今の自分が把握できているのは、いわば「首都」や「観光地」のような、誰かがすでに見たこと・聞いたことのある場所ばかりだ。プロンプトで記述できるのも、そうした目立つ地点に限られている。
            </p>
            <p>
              そこへ一直線に向かうのではなく、道中にあるものを見つける実践をしたい。緩やかに目的地を意識しながらも、脇道に逸れることそのものを重視する。散歩のような移動。
            </p>
            <p>
              なんのことはない。「自分の手でコーディングする」ことのレトロニムとして、これを「Walking
              Coding」と呼び、自覚的に実践する。
            </p>
            <p>つくっている最中に考えていることを記録する。</p>
            <p>それを「walking」というアナロジーのもとで分析する。</p>
          </div>
        </article>
      </main>
    </div>
  );
}
