let grid, next;
const w = 200,
  h = 200;
const dA = 1.0,
  dB = 0.5;
const feed = 0.055,
  kill = 0.062;

function setup() {
  createCanvas(w, h);
  pixelDensity(1);
  grid = [];
  next = [];
  for (let x = 0; x < w; x++) {
    grid[x] = [];
    next[x] = [];
    for (let y = 0; y < h; y++) {
      grid[x][y] = {a: 1, b: 0};
      next[x][y] = {a: 1, b: 0};
    }
  }
  // 中央に種を撒く
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      let x = floor(w / 2) + i;
      let y = floor(h / 2) + j;
      grid[x][y].b = 1;
    }
  }
}

function draw() {
  for (let x = 1; x < w - 1; x++) {
    for (let y = 1; y < h - 1; y++) {
      let a = grid[x][y].a;
      let b = grid[x][y].b;

      // ラプラシアン（隣接セルの平均との差）
      let lapA =
        -a +
        0.2 *
          (grid[x - 1][y].a +
            grid[x + 1][y].a +
            grid[x][y - 1].a +
            grid[x][y + 1].a) +
        0.05 *
          (grid[x - 1][y - 1].a +
            grid[x + 1][y - 1].a +
            grid[x - 1][y + 1].a +
            grid[x + 1][y + 1].a);
      let lapB =
        -b +
        0.2 *
          (grid[x - 1][y].b +
            grid[x + 1][y].b +
            grid[x][y - 1].b +
            grid[x][y + 1].b) +
        0.05 *
          (grid[x - 1][y - 1].b +
            grid[x + 1][y - 1].b +
            grid[x - 1][y + 1].b +
            grid[x + 1][y + 1].b);

      next[x][y].a = a + (dA * lapA - a * b * b + feed * (1 - a));
      next[x][y].b = b + (dB * lapB + a * b * b - (kill + feed) * b);

      next[x][y].a = constrain(next[x][y].a, 0, 1);
      next[x][y].b = constrain(next[x][y].b, 0, 1);
    }
  }
  [grid, next] = [next, grid];

  loadPixels();
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let i = (x + y * w) * 4;
      let c = floor((grid[x][y].a - grid[x][y].b) * 255);
      pixels[i] = c;
      pixels[i + 1] = c;
      pixels[i + 2] = c;
      pixels[i + 3] = 255;
    }
  }
  updatePixels();
}
