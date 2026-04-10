# Ribbon Trails — 「線→面」の3D拡張

[2026-03-01のスケッチ](/diary/2026-03-01)で書いてた一節：

> 線の幅をさらに太くすると、面になる。
> 線を動かして作るものを面の動きの根拠にしていると、「なんだかよくわからないけど気持ちのいい動き」というのに辿り着けるんじゃないかな、と思ってやってみた。
>
> こういうズラシで因数分解しづらくする。

「線を太くする」を3Dに持っていくと、ribbon trail（リボン軌跡）になる。ゲームで剣の振りが残像になるあれ。

## 何が起きるか

動く点の軌跡を、線じゃなくて**幅を持った帯（リボン）**として描く。各時点での「進行方向に垂直なベクトル」を計算して、その両側にオフセットをつける。

例えば点が円を描くと、ドーナツ状のリボンになる。点がspring-layoutで動くと、揺れるリボンになる。3/1で言ってた「線の動きを面の根拠にする」が、文字通り3Dで実現できる。

[Three.jsのMeshLine](https://github.com/spite/THREE.MeshLine) が定番ライブラリ。デモを見ると「線」だけど厚みがあって、カメラの向きに対して常に正面を向く。

## 仕組み

愚直に書くとこう：

```js
let history = [];  // 過去N点の位置
const width = 10;

function update(p) {
  history.push(p.copy());
  if (history.length > 50) history.shift();
}

function drawRibbon() {
  beginShape(TRIANGLE_STRIP);
  for (let i = 0; i < history.length - 1; i++) {
    let p = history[i];
    let next = history[i + 1];
    // 進行方向
    let dir = p5.Vector.sub(next, p).normalize();
    // 進行方向に垂直なベクトル
    let perp = createVector(-dir.y, dir.x);
    // 両側にオフセット
    let left = p5.Vector.add(p, p5.Vector.mult(perp, width));
    let right = p5.Vector.sub(p, p5.Vector.mult(perp, width));
    vertex(left.x, left.y);
    vertex(right.x, right.y);
  }
  endShape();
}
```

これだけで「太さを持った軌跡」になる。2Dならこれで十分。

3Dの場合はちょっとややこしくて、**カメラ方向に対する垂直ベクトル**を計算する必要がある（リボンが常にカメラを向くように）。Three.jsのMeshLineはこれをシェーダーでやってる。

## 「因数分解しづらくする」への接続

3/1で書いてた「ズラシで因数分解しづらくする」というアイデア、ribbon trailsはまさにそれを体現する：

1. **元の動き**（点の軌跡）には明確な数式がある
2. **太さ**を加える → 動きの根拠が「点」から「帯」に移る
3. **過去Nフレームの履歴**を持つ → 時間軸が空間に折り畳まれる
4. **カメラ向きに反応する**（3D版） → 視点によって見え方が変わる

これだけ層を重ねると、見る人は「元の動き」を逆算できなくなる。でも気持ちよさは伝わる。biological motion研究の話とも繋がる：脳は元の動きを認識しなくても、「物理的整合性」だけで意図を読み取れる。

## 02-23/02-26/02-28との繋がり

[2026-02-23](/diary/2026-02-23)から始まった「ベジェ閉路上を線が動くアニメーション」のシリーズ。あれをribbonで描き直すと、線がうねる平面として可視化される。3/1で「線幅500」みたいな極端な値で実現してたのを、もっと正確に「面」として制御できる。

## さらに見るなら

- [THREE.MeshLine](https://github.com/spite/THREE.MeshLine) — Three.jsの定番リボンライブラリ
- [Three.js examples: Line Meshline](https://threejs.org/examples/?q=line) — 公式サンプル群
- [TouchDesigner: Trail SOP](https://docs.derivative.ca/Trail_SOP) — VJツールでのtrail実装の例
- [Inigo Quilez: 3D ribbons](https://www.shadertoy.com/view/MldfDH) — シェーダーで全部やる版
