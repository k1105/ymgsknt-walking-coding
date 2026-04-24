let pg;
let thermalShader;
let img;

function preload() {
  thermalShader = loadShader("thermal.vert", "thermal.frag");
  img = loadImage("/assets/photo.jpg");
}

function setup() {
  let s = min(windowWidth / img.width, windowHeight / img.height);
  createCanvas(img.width * s, img.height * s, WEBGL);
  pg = createGraphics(img.width * s, img.height * s);
  img.resize(img.width * s, img.height * s);
  noStroke();

  pg.blendMode(DIFFERENCE);

  for (let i = 0; i < 100; i++) {
    pg.rotate((i * PI) / 200);
    pg.image(img, 0, 0);
  }
}

function draw() {
  shader(thermalShader);
  thermalShader.setUniform("tex", pg);
  thermalShader.setUniform("u_time", millis() / 1000.0);
  rect(-width / 2, -height / 2, width, height);
}
