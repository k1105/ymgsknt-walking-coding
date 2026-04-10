# p5.js WEBGLのテクスチャマッピング — vertex()に(u,v)を渡すだけ

## 調査トピック

p5.js WEBGLモードでのテクスチャマッピング。vertex()のUV座標指定とプロシージャルメッシュへの適用。

## 見つけたもの

### 基本

- `texture(img)` でテクスチャを設定、`vertex(x, y, z, u, v)` の5引数でUV座標を指定
- `textureMode(NORMAL)` で(u,v)を0〜1に正規化。画像サイズに依存しない
- `textureWrap(REPEAT)` でテクスチャをタイリング可能

### p5.Geometryでの扱い

- `myGeometry.uvs` 配列にUV座標が格納される
- 頂点追加順にUVが並ぶ（vertices[0]のUVはuvs[0], uvs[1]）

### Custom 3D Geometry

- Paul Wheelerの記事: p5.jsでプロシージャルな3Dジオメトリを生成する方法
- `beginShape()` + `vertex()` で自由な形状にテクスチャを貼れる
- TRIANGLE_STRIP, QUAD_STRIP等で面を構成

## 山岸の関心との接続点

- **昨日の日記**: 「生成的に作られたシェイプに無理やりテクスチャマッピングをする」と書いていた
- **実装の接続**: 昨日の粒子群をグリッドに並べて面を張り、テクスチャを載せる → noiseで画像が歪む映像
- **VJ応用**: カメラ映像やVJ素材をリアルタイムに歪ませるエフェクトに直結

## Discord投稿

researchチャンネルに投稿済み（2026-04-09 06:42 JST）
