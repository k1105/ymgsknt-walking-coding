let pg;
let bloomShader;

function preload() {
  bloomShader = loadShader("bloom.vert", "bloom.frag");
}

function setup() {
  createCanvas(innerWidth, innerHeight, WEBGL);
  pg = createGraphics(innerWidth, innerHeight);
  noStroke();
}

function draw() {
  pg.background(0);
  pg.noStroke();
  pg.fill(255);
  pg.circle(mouseX, mouseY, 100);
  pg.fill(0);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      pg.circle((width * i) / 10, (height * j) / 10, 80);
    }
  }

  shader(bloomShader);
  bloomShader.setUniform("tex", pg);
  bloomShader.setUniform("resolution", [width, height]);
  rect(-width / 2, -height / 2, width, height);
}
