# Shader Post-Process — 「後からかける」シェーダー

[2026-04-13](/diary/2026-04-13)でbloomシェーダーを初めて書いて、[2026-04-21](/diary/2026-04-21)でサーモフィルターをGPUに移植した。両方とも「p5.jsで描いたものにシェーダーをかける」パイプライン。

このパイプライン自体をもっと発展させると何ができるか。

## ポストプロセスの考え方

「描画（レンダリング）」と「加工（ポストプロセス）」を分離する。描画はp5.jsでもThree.jsでも何でもいい。加工はフラグメントシェーダーで行う。

これが強力なのは、**どんな入力にも同じ加工をかけられる**こと。bloomシェーダーを1つ書けば、Voronoiにもフローフィールドにも円充填にも使える。

## パイプラインの構成

```
p5.js描画 → createGraphics (2D)
         → shader() でフラグメントシェーダーを適用
         → 画面に出力
```

複数のシェーダーを直列につなぐこともできる（マルチパス）：
```
描画 → bloom → chromatic aberration → grain → 出力
```

## 使えるエフェクト一覧

すでにやったもの：
- **Bloom** (04-13, 04-14) — 明るい部分が滲む
- **Thermal colormap** (04-21) — 明るさを色に変換

まだやってないもの：
- **Chromatic aberration** — RGB各チャンネルを少しずらす。3行で書ける
- **Film grain** — ランダムノイズを加算
- **Vignette** — 四隅を暗くする
- **Color grading** — 色温度・彩度・コントラストの調整
- **Pixelation** — UV座標をfloor()で丸める
- **Glitch** — 行をランダムにずらす
- **Displacement map** — 別の画像を使ってUV座標をずらす

## さらに見るなら

- [Shadertoy: Post Processing](https://www.shadertoy.com/results?query=post+processing) — ポストプロセス系シェーダーの宝庫
- [The Book of Shaders](https://thebookofshaders.com/) — シェーダーの基礎
- [LearnOpenGL: Post Processing](https://learnopengl.com/Advanced-OpenGL/Framebuffers) — フレームバッファの仕組み
