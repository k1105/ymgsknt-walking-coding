# Audio Reactive — VJの「音に合わせる」を p5.js でやる

[2026-01-28のVJイベント日記](/diary/2026-01-28)で、こう書いてた：

> 今日、音に合わせて演出を考える、ということについて初めて真剣に向き合ったような気がするぞ。音に合わせるならbpmで考えなきゃダメ（millisを1/1000で割り算する、とかそういうんじゃない）。
>
> まだ経験値も少ない自分がVJをやる時には、やってきた音に合わせて「それを絵で表現するなら、こんな感じ？」を、探り当てられるような下地づくりが必要で、パラメータスライダーを操作するだけで絵の質が変化するようなものを持っていくのが良さそう

「BPMで考える」と「パラメータスライダーで絵の質が変化する」、この2つを地続きにする方法がaudio-reactive。マイクや音声入力からリアルタイムに音を解析して、その特徴量をスケッチのパラメータに直接送り込む。

## 何が起きるか

p5.sound（p5.jsの公式音響ライブラリ）を使うと、3つの値が手に入る：

1. **Amplitude（音量）** — 全体の大きさ。0.0〜1.0
2. **FFT（周波数スペクトル）** — 音の周波数成分。低音域・中音域・高音域に分けられる
3. **Beat detection** — ビート（キック）が鳴った瞬間を検出

これらを直接スケッチのパラメータに繋ぐと、「絵が音に呼吸する」状態が作れる。

[Coding TrainのSound visualization動画](https://thecodingtrain.com/tracks/sound) にp5.sound系の解説が並んでる。最初の数本でAmpltideとFFTの基本がわかる。

## 最小実装

マイクから入力を取って、円のサイズを音量で変える：

```js
let mic, fft;

function setup() {
  createCanvas(800, 800);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
}

function draw() {
  background(0);
  
  // 音量
  let level = mic.getLevel();
  
  // 周波数スペクトル
  let spectrum = fft.analyze();
  let bass = fft.getEnergy("bass");      // 低音域
  let mid = fft.getEnergy("mid");        // 中音域
  let treble = fft.getEnergy("treble");  // 高音域
  
  // 描画
  fill(255, 100, 100);
  circle(width/2, height/2, level * 1000 + 50);
  
  // スペクトル可視化
  noFill();
  stroke(255);
  beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    vertex(map(i, 0, spectrum.length, 0, width), height - spectrum[i]);
  }
  endShape();
}
```

これで「マイクに向かって声を出すと円が大きくなる」「音楽を流すと波形が画面下に出る」状態になる。

## VJ特化：音楽ファイルを直接読み込む

イベントで使うなら、VJスケッチに音源を直接読み込む方が確実：

```js
let song;
function preload() {
  song = loadSound("track.mp3");
}

function setup() {
  createCanvas(800, 800);
  fft = new p5.FFT();
  song.play();
}
```

DJの音をマイクで拾うのも可能だけど、ノイズが入る。事前に音源があるならそっちが確実。

## BPMと「パラメータが呼吸する」の繋ぎ方

1/28で言ってた「BPMで考える」と組み合わせる：

```js
const BPM = 128;
const beatMs = 60000 / BPM;

function draw() {
  let phase = (millis() % beatMs) / beatMs;  // 0.0 → 1.0 → 0.0
  let beatPulse = 1 - phase;  // beat直後がピーク
  
  // 音の低音域とBPMパルスを重ねる
  let bass = fft.getEnergy("bass") / 255;
  let combined = beatPulse * 0.5 + bass * 0.5;
  
  // 何かのパラメータに使う
  strokeWeight(combined * 30 + 1);
}
```

**BPMベースのパルス（事前にわかる）+ 音量変動（リアルタイム）** の重ね合わせ。事前にわかる安定感と、リアルタイムの躍動感の両方が手に入る。

## ビート検出

「キックが鳴った瞬間に何かする」をやるには、`beatDetect`系のロジックが必要：

```js
let lastBass = 0;
function isBeat() {
  let bass = fft.getEnergy("bass");
  let detected = (bass > 200 && bass > lastBass + 30);
  lastBass = bass;
  return detected;
}

function draw() {
  fft.analyze();
  if (isBeat()) {
    // フラッシュとかshakeとか
  }
}
```

これで「曲のキックに合わせてカメラがshakeする」ができる。[Cinematic Camera](/research/cinematic-camera.md) と組み合わせるとVJ完成度が一気に上がる。

## 1/28の「パラメータスライダー」との関係

1/28で「パラメータスライダーを操作するだけで絵の質が変化するようなもの」を作りたいって書いてたけど、audio-reactiveはそれの**自動運転版**。スライダーを音が勝手に動かしてくれる。

スライダーUIも残しておいて、音入力を一時的に切れる仕組みにすると「自動 + 手動」の切り替えができる。即興VJに強い。

## さらに見るなら

- [p5.sound reference](https://p5js.org/reference/#/libraries/p5.sound) — 公式リファレンス
- [Coding Train: Sound Visualization](https://thecodingtrain.com/tracks/sound) — Shiffman動画群
- [Hydra](https://hydra.ojack.xyz/) — ライブコーディングVJ環境。audio-reactiveのお手本
- [Tone.js](https://tonejs.github.io/) — p5.soundより本格的な音響ライブラリ。音を作る側にも使える
