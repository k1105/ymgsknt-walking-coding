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
              Walking
              Codingとは、「人の手でコーディングすること」を意味する言葉です。
              AIエージェントによるコーディングが登場し、従来の「人の手によって」コードを書く行為が相対化された今、その意義を問い直すことで生まれた
              <Link href="https://ja.wikipedia.org/wiki/レトロニム">
                レトロニム
              </Link>
              です。
            </p>
            <p>
              AIエージェントは、目的地を伝えるだけでその場所まで連れて行ってくれます。それはタクシーに乗っているような気持ちです。あるいはCursorのように、Tabキーを押すだけで次々とコードが出現するエディターでのコーディングは、ドライブのようでもあります。
            </p>
            <p>
              そうしたコーディングに対して従来のコーディングは、速さの点では下位互換に位置付けられます。しかしビジュアルコーディングのように、「何を作るのか」がはっきりとしない中で手を動かし、偶然現れた振る舞いやリズムに美的価値を見出すような活動には、AIエージェントには代替できないものがあります。この観点から、「人の手でコーディングすること」を「徒歩での移動（=walking）」のアナロジーを用いて捉え、コーディングが創作に与える影響や意義について再考します。
            </p>
            <p>
              このWebサイトでは、日課として、あえてAIを使わないでコードを書き、その過程での試行錯誤や感想を日記として残します。このとき日記は、なぜそのコードを書くことになったのかを説明する「コードのコード」になるような気がするし、そうならないかもしれません。
            </p>
            <p>
              重要なのは、コーディングという行為を日常の近くに引き寄せておくことであって、継続する気持ちを萎縮させるような決まりごとは設けないようにしています（下記、Code
              of walkingを参照）。
            </p>

            <h1 className="text-2xl mt-32">Code of Walking</h1>
            <p>
              「日記」には、コードから読み解くことのできない試行錯誤の過程や制作者の衝動を書くことが推奨されますが、そうでなくても構いません。今日起こった嬉しかったこと、最近考えていること、3日と続かない連載企画を勝手に始めることも許容します。
            </p>
            <p>
              この取り組みは、探索フェーズ、分析フェーズ、研究フェーズの3つのフェーズに分けて進めます。
              初期の探索フェーズは、自身の興味関心を探索することを目的と据えて、過度に分析やルールづくりをしないように進めます。
            </p>
            <p>
              分析フェーズでは、探索フェーズで得られた知見をもとに、より深い理解を目指します。
            </p>
            <p>
              このプロジェクトはAIの使用自体は禁止しません。例えば、実装に行き詰まりを感じた場合や次のステップに向けた構想を練る際に、AIを使用をすることがあります。ただし最低限のルールとして、AIにコーディング作業自体を依頼することは禁止します。コードの提案を受けた場合であっても、それを「写経する」ようにします。
            </p>
            <p>
              このプロジェクトでは、体系的に進めるようなことをしません。昨日と言っていることが違う、という状況を許容しますし、むしろ尊重します。
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
