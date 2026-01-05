"use client";
import Link from "next/link";
import styles from "./Statement.module.css";

export default function StatementPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Text Characters */}
      <div
        className={`fixed inset-0 top-1/6 pointer-events-none text-black ${styles.header}`}
      >
        What&apos;s this?
      </div>

      {/* Content */}
      <main className={`relative max-w-4xl py-64 ${styles.textContainer}`}>
        <article className="prose prose-invert">
          <div className="text-lg text-black leading-relaxed space-y-6">
            <h1 className="text-2xl">Walking Codingとは?</h1>
            <p>
              AIエージェントを用いたコーディングの登場を受けて、従来のように「人の手によって」コードを書く行為を命名した
              <Link href="https://ja.wikipedia.org/wiki/%E3%83%AC%E3%83%88%E3%83%AD%E3%83%8B%E3%83%A0">
                <span className="underline">レトロニム</span>
              </Link>
              です。
            </p>
            <p>
              人がコードを書かなくても良い時代にあえてコードを書く最中に感じたこと、その過程での試行錯誤の記録を言葉で残すことで、その行為が創作に与える影響や意義について再考します。
            </p>
            <h1 className="text-2xl mt-32">Background</h1>
            <p>コードを書かなくなった。</p>
            <p>
              要件定義をGeminiに依頼して、実装をClaudeに依頼する。大枠のレイアウトをIllustratorで組んだら、スクリーンショットを撮ってレイアウトを起こしてもらう。「spring-layout」「convex
              hull」と言うだけで、期待のアルゴリズムが実装される。
            </p>
            <p>
              コードが手元を離れていく。些細なバグですら向き合うのが面倒になり、AIに「なんとかして」もらう場面が増えてくる。
            </p>
            <p>
              悲観はしていない。AIエージェントが行っていることはすでに「代替」を超えていて、私たちはより速く、より遠くを目指せるようになったのだから。システム構築という長い道のりを「徒歩」でしか移動できなかったところに、「自動車」のような移動手段が加わった。そう考えれば、それまでとは全く異なる質を期待して良いはずだ。
            </p>
            <p>
              ただ、「自動車」でしか辿り着けない場所があるのと同様に、「徒歩」でしか辿り着けない場所もある。コーディングをしていると、この定数をいたずらに大きくしたら？とか、乱数にしたらどうなる？とか、「寄り道」のような操作をすることがある。特にビジュアルコーディングのような、目的地が作り手にとっても曖昧で、何が正解で失敗とも言えない中、目の前に現れたものに美的価値を見出す作業こそ、「寄り道」は大切なことのように思う。
            </p>
            <p>
              だから「walking」する。今のところプロンプトに記述できるのは、いわば「首都」や「観光地」のような、誰かがすでに訪ねて、一定の価値を見出している場所だ。
              そこへまっすぐに向かうのではなく、脇道に外れたり、目的を持たずに散歩するように、自己目的的な移動の中で何かを見出すプロセスの価値を確かめたい。
            </p>
            <h1 className="text-2xl mt-32">Manner of Walking</h1>
          </div>
        </article>
      </main>
    </div>
  );
}
