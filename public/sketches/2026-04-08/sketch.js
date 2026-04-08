let particles = [];
const num = 500;

function setup() {
  createCanvas(800, 800, WEBGL);
  for (let i = 0; i < num; i++) {
    particles.push(createVector(
      random(-200, 200),
      random(-200, 200),
      random(-200, 200)
    ));
  }
}

function draw() {
  background(0);
  orbitControl();

  stroke(255, 50);
  strokeWeight(2);
  for (let p of particles) {
    point(p.x, p.y, p.z);
  }
}
