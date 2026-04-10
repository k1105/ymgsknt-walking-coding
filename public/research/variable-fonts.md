# Variable Fonts — 「打鍵の強さで太さが変わる」の本格版

[2026-01-11のスケッチ](/diary/2026-01-11)で、打鍵の強さでテキストの太さが変わるエディターを作ってた。Dysfluent Monoの作者Conor Foranさんのワークショップの話と、「タイピングの気分が見えてくる」との考察。

> 今回作った打鍵の強さが文字のウェイトに反映されるエディターからは、もっと繊細な、タイピングの気分が見えてくる。そういう気分が見えてくると、またちょっと違う表現ができるのかな。

「もっと繊細な変化」をやるなら、Variable Fontsがど真ん中の道具。

## 何が起きるか

普通のフォントは「Light」「Regular」「Bold」みたいに離散的なweight。Variable Fontsは**1つのフォントファイルの中で連続的に変化する軸**を持つ。weight 100〜900の任意の値（300.5でも812.7でも）が指定できる。

しかも軸はweightだけじゃない：
- **wght** (weight): 太さ
- **wdth** (width): 幅
- **slnt/ital** (slant): イタリック度
- **opsz** (optical size): 視覚補正
- そしてフォント独自の軸（例：「丸み」「角ばり度」「セリフの長さ」）

CSSなら：
```css
font-variation-settings: "wght" 654, "wdth" 87, "slnt" -3.5;
```
で指定できる。

[V-Fonts.com](https://v-fonts.com/) に主要なVariable Fontsが並んでて、スライダーをぐりぐり動かせる。文字がリアルタイムに変形するのが楽しい。

特にRecursiveとかFraunces、Robotoは軸が豊富で、「同じ文字が別人格になる」感じがある。

## 1/11のエディターに足すなら

打鍵の強さ（duration）だけじゃなく、複数の軸を同時に動かせる：

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Recursive:wght@300..1000;CASL@0..1&display=swap');
  .key {
    font-family: Recursive;
    transition: font-variation-settings 0.1s;
  }
</style>
```

```js
function onKeyPress(key, durationMs) {
  let weight = map(durationMs, 0, 500, 300, 1000);     // 押した時間 → 太さ
  let casual = map(durationMs, 0, 500, 0, 1);          // 押した時間 → 手書き感
  span.style.fontVariationSettings = 
    `"wght" ${weight}, "CASL" ${casual}`;
}
```

これだけで、「強く長く押した文字は太くて手書きっぽい」「軽く速く打った文字は細くて機械的」という二軸の表現になる。打鍵の強さ＋速さ＋リズム＋押し方の癖、まで読み取れる。

## 「気分」を更に繊細に拾うために

Conor Foranさんのワークショップで山岸さんが書いてた「コミュニケーションの中でどもる」「二人のあいだに漂う」体験。これを文字で表現するなら、変動軸として：

- **文字単体の特性**: 押した強さ・速さ・滞在時間
- **文脈的な特性**: 前の文字との時間差、逡巡の頻度
- **社会的な特性**: 受信者がオンラインかどうか、相手のステータス

これら全部を別の軸にマッピングすれば、Dysfluent Monoの「視覚化」を超えた、より動的な「気分のフォント」になる。

## ベジェ曲線との繋がり

[2026-01-20〜](/diary/2026-01-20) のベジェ文字ブラシシリーズも、根は同じ問い。**文字を「形」じゃなくて「動き」として扱う**。Variable Fontsは「形のパラメータ化」、ベジェ文字ブラシは「形の経路化」。

両方を組み合わせるとさらに：ベジェ曲線上を動きながら、その位置によってwidth/weightが変わる、みたいな。

## さらに見るなら

- [V-Fonts.com](https://v-fonts.com/) — Variable Fontsカタログ、全部触れる
- [Recursive](https://www.recursive.design/) — Variable軸が特に豊富。Mono/Sans混合
- [Fraunces](https://fonts.google.com/specimen/Fraunces) — Soft, Wonk軸など独自軸
- [Decovar](https://github.com/googlefonts/decovar) — Googleの実験的な装飾Variable Font。15軸ある
- [variablefonts.io](https://variablefonts.io/) — 解説サイト、CSS APIの仕様も
