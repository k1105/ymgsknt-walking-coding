# Bloom Variations — 1つのシェーダーから5つの表情

[2026-04-13のスケッチ](/diary/2026-04-13)で、基本的なbloomシェーダーを書いた。「ブラーしたものをマスクするのとは違い、回折光に似た効果が出る」って書いてたよね。

今のbloomは「全方向に均一にブラー」してるだけ。forループの中の`offset`の計算を1行変えるだけで、全く別の効果が出る。

## 1. Anamorphic Streak（横一直線の光条）

ブラーのy成分を0にすると、横方向だけに光が伸びる：

```glsl
// 今のコード
vec2 offset = vec2(x, y) * 3.0 / resolution;

// → 横だけにブラー
vec2 offset = vec2(x, 0.0) * 8.0 / resolution;
```

80年代MVのカメラフィルター（[anamorphicレンズ](/research/80s-mv-grade.md)）を再現する最もシンプルな方法。`8.0`を大きくすると光条が長くなる。

## 2. Radial Bloom（放射状bloom）

中心からの方向に沿ってブラーする：

```glsl
vec2 dir = normalize(uv - 0.5);
for (float i = 0.0; i < 8.0; i += 1.0) {
    vec2 offset = dir * i * 5.0 / resolution.x;
    vec4 s = texture2D(tex, uv + offset);
    float bright = max(s.r, max(s.g, s.b));
    bloom += s * smoothstep(0.8, 1.0, bright);
    count += 1.0;
}
```

画面中心から放射状に光が広がる。ズームブラー的な効果。スケッチの白い円が中心から離れてると、光が引き伸ばされて彗星の尾みたいになる。

## 3. Colored Bloom（色付きbloom）

bloomベクトルに色を乗せる：

```glsl
// 青いbloom
gl_FragColor = col + bloom * vec4(0.5, 0.7, 1.5, 1.0);

// オレンジbloom
gl_FragColor = col + bloom * vec4(1.5, 0.8, 0.3, 1.0);

// 虹色bloom（uvの位置で色が変わる）
vec3 rainbow = 0.5 + 0.5 * cos(6.28 * (uv.x + vec3(0.0, 0.33, 0.67)));
gl_FragColor = col + bloom * vec4(rainbow, 1.0);
```

今のスケッチだと白い光が滲んでるけど、色を乗せると「光に温度がある」感じが出る。

## 4. Inverse Bloom（逆bloom）

bloomを加算じゃなくて減算する：

```glsl
gl_FragColor = col - bloom * 0.5;
```

明るい部分の周囲が**暗く**なる。写真の「バーンイン」（焼き込み）に近い効果。光源の周りに暗いハローが出て、日食みたいな感じ。

今のスケッチの黒い円グリッドと組み合わせると、「光が通る穴の周りが逆にさらに暗い」という不思議な空間が出るかもしれない。

## 5. Bloom Only（元画像を消す）

```glsl
gl_FragColor = bloom * 3.0;
```

元の形が完全に消えて、光の滲みだけが見える。幽霊みたいな絵。黒い円グリッドのカバーも消えて、bloomだけが浮かぶ。「地のようでその下にものを通せる余地のある空間」が、bloomだけになると「空間自体が見える」に変わるかも。

## 組み合わせ

これらは排他じゃなくて組み合わせられる：
- **Anamorphic + Colored**: 横に伸びる青い光条
- **Radial + Bloom Only**: 放射状の光だけが見える
- **Colored + Inverse**: 色付きの暗いハロー

1行変えるだけだから、全部試してみて「なぜこうなるか」を言語化するのがwalking codingっぽい。

## さらに見るなら

- [Shadertoy: GLOW TUTORIAL](https://www.shadertoy.com/view/3s3GDn) — bloom基礎
- [Shadertoy: Anamorphic Bloom](https://www.shadertoy.com/view/4sX3Rs) — 方向bloom
- [LearnOpenGL: Bloom](https://learnopengl.com/Advanced-Lighting/Bloom) — 2パスbloomの解説（高品質版）
