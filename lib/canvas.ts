/**
 * Canvas描画用のユーティリティ関数
 */

/**
 * ラフな曲線の制御点を計算する
 * @param x1 始点のX座標
 * @param y1 始点のY座標
 * @param x2 終点のX座標
 * @param y2 終点のY座標
 * @param seed ランダム性のためのシード値
 * @param scale オフセットのスケール（デフォルト: 1）
 * @returns 制御点の座標 {controlX, controlY}
 */
export function calculateRoughCurveControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  scale: number = 1
): {controlX: number; controlY: number} {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // ラフな感じを出すためのオフセット計算
  const offsetX = (Math.sin(seed) * 10 + Math.cos(seed * 0.3) * 5) * scale;
  const offsetY =
    (Math.cos(seed * 0.2) * 10 + Math.sin(seed * 0.4) * 5) * scale;

  return {
    controlX: midX + offsetX,
    controlY: midY + offsetY,
  };
}

/**
 * CanvasをRetinaディスプレイ対応でセットアップする
 * @param canvas Canvas要素
 * @param width 論理的な幅
 * @param height 論理的な高さ
 * @returns スケール済みの2Dコンテキスト、またはnull
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  return ctx;
}

/**
 * 2点間をラフな曲線で描画する
 * @param ctx Canvas 2Dコンテキスト
 * @param x1 始点のX座標
 * @param y1 始点のY座標
 * @param x2 終点のX座標
 * @param y2 終点のY座標
 * @param seed ランダム性のためのシード値
 * @param scale オフセットのスケール（デフォルト: 1）
 */
export function drawRoughCurve(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  scale: number = 1
): void {
  const {controlX, controlY} = calculateRoughCurveControlPoint(
    x1,
    y1,
    x2,
    y2,
    seed,
    scale
  );
  ctx.quadraticCurveTo(controlX, controlY, x2, y2);
}
