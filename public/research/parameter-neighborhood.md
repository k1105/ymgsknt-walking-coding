# Parameter Neighborhood — 「ちょっとした違いで全然違う」の探究

[2026-05-09](/diary/2026-05-09)と[2026-05-10](/diary/2026-05-10)で、こう書いてた：

> 数学的な操作においては「ただ、数値を変えただけ」という線形的な空間の変化でしかないところに、いろんなものを感じ取れるだけのシワが複雑に刻み込まれている

> 数直線上で見たときに差分がほとんどなくても、質的な違いをもたらす密度の方は十分に稠密だとして、ちょっと変えただけでもガラッと変わったように感じられることがある

これ、数学的には**分岐理論（bifurcation theory）**と呼ばれる領域に近い。

## 何が起きるか

パラメータを連続的に動かしていくと、出力がある点で**不連続に変わる**ことがある。Lorenzアトラクターの `ρ` を少し変えるとカオスと周期の間を行き来するし、reaction-diffusionの `feed/kill` をほんの0.001ずらすだけで斑点が縞に変わる。

数学的には「滑らかに変えているのに、質的に異なるもの」が出てくる現象。それを人間が感じ取れるのは、知覚の側にも非線形な閾値があるから。

## 探究の方法

パラメータをアニメーションで連続的に変化させて、その「質的な変わり目」を探す：

```js
function draw() {
  let t = millis() / 10000;  // ゆっくり変化
  let param = map(sin(t), -1, 1, 0.03, 0.07);  // パラメータ範囲
  
  // paramを使ってスケッチを描画
  // ...
  
  // 現在のparam値を表示
  fill(255);
  text(`param: ${param.toFixed(4)}`, 10, 20);
}
```

パラメータが変化する中で「あ、ここで変わった」という瞬間を見つける。それが分岐点。

## 過去スケッチとの接続

- reaction-diffusionの `feed/kill` — [Karl Simsの早見表](https://www.karlsims.com/rd.html) は「パラメータ空間の地図」そのもの
- Lorenzアトラクターの `ρ` — 周期軌道とカオスの境界
- bloomシェーダーの `threshold` — 閾値を超えた瞬間に見え方が変わる

05-10で書いてた「はみ出すような動きをあえて取り入れてみた。そしたら登場感はより印象的になった」も同じ話。boundary（境界）を超える瞬間が、質的な変化を生む。

## さらに見るなら

- [Bifurcation diagram](https://en.wikipedia.org/wiki/Bifurcation_diagram) — ロジスティック写像の分岐図が最も有名
- [Shadertoy: Bifurcation](https://www.shadertoy.com/results?query=bifurcation) — 分岐図の可視化
- [Steven Strogatz "Nonlinear Dynamics and Chaos"](https://www.stevenstrogatz.com/books/nonlinear-dynamics-and-chaos) — 非線形力学の古典的教科書
