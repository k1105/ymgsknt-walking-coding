# Cinematic Camera — 「カメラワークどうしてるんだろ」の答え

[2026-01-09のスケッチ](/diary/2026-01-09)で、p5.jsのカメラAPIを試して書いてた：

> 最初3つの引数でカメラ位置を指定して、そのカメラが注目する座標を次の3つのパラメータで設定する。UnityだとlookAtだっけ？

そして[2026-01-12](/diary/2026-01-12)では：

> でも、もっとグシャっとしてくると面白いのかも。他の人のMVとかみてみようかな。カメラワークどうしてるんだろ。考え方をあんま知らない。

「カメラワークの考え方」を、creative coding視点で言語化する話。

## 何が起きるか

`camera(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, ...)` というAPIは、**1フレームのカメラの状態**を決めるもの。でも実際のカメラワークの面白さは「**時間の中での変化**」にある。

映像のカメラワークは大きく5種類に分類できる：

1. **Pan（パン）** — 中心を固定して向きだけ変える
2. **Tilt（チルト）** — 上下に首を振る
3. **Truck/Dolly（トラック/ドリー）** — カメラ自体を平行移動・前後移動
4. **Zoom（ズーム）** — 画角を変える（焦点距離）
5. **Rotation around target（オービット）** — 対象を中心にぐるっと回る

これらに加えて、cinematicに見せる4つの「味付け」：

- **Camera shake** — カメラを微かに揺らす（リアルさ・緊張感）
- **Look-at lerp** — カメラの「見ている対象」を補間で動かす（滑らかな視線移動）
- **Damping** — 動きに慣性をつける（重みを感じさせる）
- **Field of view (FOV) breathing** — 画角を呼吸のように微妙に変える

## p5.jsで全部やる

p5のWEBGLモードはeye/centerの座標で全てを制御する。各カメラワークは「eyeとcenterをどう動かすか」のパターン。

```js
let camPos, camTarget;     // カメラの実際の位置
let targetPos, targetTarget; // カメラの目標位置
const damping = 0.05;

function setup() {
  createCanvas(800, 800, WEBGL);
  camPos = createVector(0, 0, 500);
  camTarget = createVector(0, 0, 0);
  targetPos = camPos.copy();
  targetTarget = camTarget.copy();
}

function draw() {
  background(0);
  
  // === ここでカメラワークを決める ===
  
  // パターン1: 対象を中心にオービット
  let angle = frameCount * 0.01;
  targetPos.set(cos(angle) * 500, 100, sin(angle) * 500);
  targetTarget.set(0, 0, 0);
  
  // パターン2: ドリー（前進）
  // targetPos.z = 500 - frameCount * 0.5;
  
  // === ここから共通処理 ===
  
  // damping: 目標に向かってlerp
  camPos.lerp(targetPos, damping);
  camTarget.lerp(targetTarget, damping);
  
  // shake: noiseで微かに揺らす
  let shakeX = (noise(frameCount * 0.05) - 0.5) * 2;
  let shakeY = (noise(frameCount * 0.05 + 100) - 0.5) * 2;
  
  camera(
    camPos.x + shakeX, camPos.y + shakeY, camPos.z,
    camTarget.x, camTarget.y, camTarget.z,
    0, 1, 0
  );
  
  // シーン
  fill(255);
  box(100);
}
```

`damping`と`shake`を入れるだけで、急に「映画っぽい」カメラに変わる。1/9で作っていたシンプルな`camera()`呼び出しが、生きた表現になる。

## 1/12で言ってた「グシャっとしてくる」

「もっとグシャっとしてくると面白いのかも」と書いてたよね。これを実現する技：

- **Whip pan**: 一瞬で大きく振る。`damping`を急に小さくして急に大きくする
- **Dutch tilt**: カメラを傾ける（`up`ベクトルを変える）`camera(..., 0, cos(0.3), sin(0.3))`
- **Glitch shake**: 突発的に大きく揺らす。frameCountが特定値の時だけshake強度を上げる
- **Cross-cut**: 1フレームで全く違う場所にカメラをワープ

特に**カメラの`up`ベクトル**を時間で変えるのは強力。地面が斜めに傾いて、めまい感が出る。

## VJで即使える応用

VJに使うなら、**音に反応する**カメラワーク：

```js
// 音量で shake強度を変える
let amp = analyzer.getLevel();  // 0.0 ~ 1.0
let shakeMag = amp * 30;

// ビートで瞬間的に大きくshake
if (beatDetected) {
  shakeMag *= 5;
}
```

[2026-01-28](/diary/2026-01-28)で「BPMで考えなきゃダメ」と書いてたよね。カメラshakeをBPMに同期させると、音と映像が一気に噛み合う。

## さらに見るなら

- [Coding Train: 3D Camera in p5.js](https://thecodingtrain.com/tracks/p5-js-and-three-js/p5-3d-camera) — Shiffmanの動画
- [Disney's 12 Principles for Camera](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation) — Anticipation, Slow in/out。カメラにも適用できる
- [Cinematic Camera in Unreal](https://docs.unrealengine.com/5.0/en-US/cine-camera-actor-properties-in-unreal-engine/) — Unreal Engineのcinematic camera設定。FOV、focal length、aperture、crop sensor などのパラメータが整理されてる
- [Brackeys: Camera shake in Unity](https://www.youtube.com/watch?v=tu-Qe66AvtY) — perlinベースのshake実装
