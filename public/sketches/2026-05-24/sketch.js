let sh;

function preload() {
  sh = loadShader("shader.vert", "shader.frag");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  background(0);
}

function draw() {
  shader(sh);
  sh.setUniform("u_time", millis() / 1000.0);
  sh.setUniform("u_resolution", [width, height]);
  rect(-width / 2, -height / 2, width, height);
}
