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
}

function draw() {
  pg.image(img, 0, 0);

  shader(thermalShader);
  thermalShader.setUniform("tex", pg);
  thermalShader.setUniform("u_time", millis() / 1000.0);
  rect(-width / 2, -height / 2, width, height);
}
