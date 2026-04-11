# 80s Music Video Grade — シャイニーバブリーの分解

[2026-04-02のフラクタル万華鏡シェーダー](/diary/2026-04-02)で初めて本格的にGLSLを触った。あの「ポストプロセスとしてシェーダーをかける」発想を、フライヤーや映像素材に適用するなら、80年代MVのあの「シャイニーバブリー」グレードがど真ん中の応用例。

実際にイベントのフライヤー作業中に話題になったやつ。

## 何が起きるか

80年代の有名なMVの1コマを思い浮かべてほしい。マリリン・マンソンとか、Bonnie Tylerとか、初期のMTV系。そこには共通する要素がある：

1. **Anamorphic streak** — 明るい光源から横一直線に伸びる青/シアンの光条
2. **Cross filter (4-point star burst)** — 明るい点から十字に伸びる星型の煌めき
3. **Bloom** — ハイライトがフワッと滲んで広がる
4. **Heavy soft focus** — 全体がほんのりボケて夢のような質感
5. **Film grain** — 暗部に粒子感
6. **Teal & magenta グレーディング** — シャドウ→シアン、ハイライト→マゼンタの「Miami Vice」配色
7. **Vignette** — 四隅が暗くなる

これらは個別の効果じゃなく、**全部レイヤーで重ねる**のが80sグレードの正体。1つの巨大なシェーダーで全部やろうとすると破綻するけど、レイヤーで分けると意外と素直。

## パイプライン

```
入力画像
  ↓
soft focus (gaussian blur 弱)
  ↓
bloom (highlight extract → blur → 加算)
  ↓
anamorphic streak (横長blur → 青に着色 → 加算)
  ↓
cross filter (highlight位置に star sprite → 加算)
  ↓
teal/magenta grade (シャドウ→teal、ハイライト→magenta)
  ↓
film grain (procedural noise 加算)
  ↓
vignette (中心からの距離で乗算)
```

各ステップは独立。`createGraphics`で複数のオフスクリーンを使い、最後にメインキャンバスで合成する。

## 各要素の最小実装

### Bloom（核となる効果）
```glsl
vec3 bloom = vec3(0.0);
for (int x = -8; x <= 8; x++) {
  for (int y = -8; y <= 8; y++) {
    vec2 off = vec2(x, y) * 4.0 / u_resolution;
    vec3 c = texture2D(u_tex, uv + off).rgb;
    bloom += smoothstep(0.6, 0.9, max(c.r, max(c.g, c.b))) * c;
  }
}
bloom /= 289.0;
```

### Anamorphic streak（青い横線）
```glsl
vec3 streak = vec3(0.0);
for (int i = -16; i <= 16; i++) {
  vec2 off = vec2(float(i) * 6.0, 0.0) / u_resolution;
  vec3 c = texture2D(u_tex, uv + off).rgb;
  streak += smoothstep(0.75, 1.0, max(c.r, max(c.g, c.b))) * c;
}
streak /= 33.0;
streak *= vec3(0.5, 0.7, 1.5);  // 青みを乗せる
```

### Cross filter（4点星）
```glsl
// 明るい点から十字に伸びる
float cross = 0.0;
for (int i = -32; i <= 32; i++) {
  vec2 hOff = vec2(float(i) * 3.0, 0.0) / u_resolution;
  vec2 vOff = vec2(0.0, float(i) * 3.0) / u_resolution;
  cross += step(0.85, max(texture2D(u_tex, uv + hOff).r, texture2D(u_tex, uv + vOff).r));
}
```
※これは荒い実装。Natronの[Ls_Glint](https://github.com/NatronGitHub/natron-plugins/blob/master/Shadertoy/Ls_Glint/Ls_Glint.1.frag.glsl) が本格版でRays/Size/Gain/Falloffのパラメータ付き。

### Teal/Magenta grade
```glsl
// シャドウをteal、ハイライトをmagentaに
vec3 graded = mix(
  base * vec3(0.7, 1.0, 1.1),  // shadow → teal
  base * vec3(1.2, 0.7, 1.0),  // highlight → magenta
  smoothstep(0.3, 0.7, length(base))
);
```

### Film grain
```glsl
float grain = fract(sin(dot(uv + u_time, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
col += grain * 0.05;
```

### Vignette
```glsl
float vig = 1.0 - length(uv - 0.5) * 1.4;
col *= vig;
```

## 物理リファレンス

シェーダーで再現する効果は全部、物理カメラの**実際のフィルター**に対応している：

- **Cross filter (Star filter)** = レンズの前のガラスに細い線が縦横/6方向/8方向に刻まれていて、光がその溝で回折して光条が伸びる。[Star Filter解説](https://pages.mtu.edu/~shene/DigiCam/User-Guide/filter/filter-star.html)
- **Anamorphic streak** = anamorphicレンズ自体の楕円形状による光の引き伸ばし
- **Bloom / glow** = 古いレンズのコーティング不足による光の散乱
- **Diffusion / Pro-Mist** = レンズ前のガラスに微細な凹凸があり、ハイライトが滲む

物理リファレンスがあると、シェーダーで「何を再現してるか」が言語化しやすい。

## 写経候補

各要素を別々のShadertoyから引っ張ってくるのが現実的：

- [Shadertoy: SPARKLE](https://www.shadertoy.com/view/3d33zM) — 動く星屑
- [Shadertoy: 2D Texture Glint](https://www.shadertoy.com/view/Xlsfzn) — 画像のハイライトにglint追加
- [Shadertoy: GLOW TUTORIAL](https://www.shadertoy.com/view/3s3GDn) — bloomの基本
- [Shadertoy: VHS Tape Shader](https://www.shadertoy.com/view/sltBWM) — VHS系の総合
- [Natron Ls_Glint GLSL](https://github.com/NatronGitHub/natron-plugins/blob/master/Shadertoy/Ls_Glint/Ls_Glint.1.frag.glsl) — cross filterの決定版実装

## 4/2との接続

4/2でCantor's Paradiseのフラクタルシェーダーを写経して「フラクタルループ」を理解した。lens flareもbloomもglintも、本質は **「同じサンプリングをずらして何度も加算する」** こと。フラクタルの「同じ変換を繰り返す」と同じ構造。あの写経経験は、この80sグレードシェーダーを書く土台になっている。

## 実用面

VJのリアルタイム素材でこれをやると、どんな入力も「90sアニメっぽい」「80sシネマっぽい」グレードになる。CSSの `filter: blur(2px) contrast(1.1) saturate(1.3)` だけでもそれっぽさは出るので、まずプロトタイプはCSSで作って、本番でシェーダーに置き換えるのが現実的。
