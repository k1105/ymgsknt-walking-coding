import Link from "next/link";

export default function StatementPage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <nav className="mb-8">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to index
          </Link>
        </nav>

        <article className="prose prose-invert max-w-none">
          <div className="text-lg text-zinc-300 leading-relaxed space-y-6">
            <p>
              このプロジェクトは、クリエイティブコーディングにおけるデイリープラクティスを記録するための場所です。
            </p>

            <p>
              p5.jsを使った日々の実験と探求を通じて、コードとアートの境界を探ります。
              毎日の小さな発見や挑戦、そして時には失敗も含めて、創作のプロセスそのものを大切にしています。
            </p>

            <p>
              ジェネレーティブアート、データビジュアライゼーション、インタラクティブな体験など、
              様々なアプローチを試しながら、表現の可能性を広げていきます。
            </p>

            <p>
              このアーカイブが、自分自身の成長の記録であると同時に、
              他の誰かのインスピレーションにもなれば幸いです。
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
