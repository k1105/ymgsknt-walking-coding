let particles = [];
const num = 50;

function setup() {
  createCanvas(800, 800, WEBGL);
  for (let i = 0; i < num; i++) {
    particles.push(createVector(
      random(-1, 1),
      random(-1, 1),
      random(-1, 1)
    ));
  }
}

function draw() {
  background(0);
  orbitControl();

  stroke(255, 50);
  strokeWeight(2);

  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.005;

  for (let p of particles) {
    let dx = sigma * (p.y - p.x) * dt;
    let dy = (p.x * (rho - p.z) - p.y) * dt;
    let dz = (p.x * p.y - beta * p.z) * dt;

    p.x += dx;
    p.y += dy;
    p.z += dz;

    point(p.x * 10, p.y * 10, p.z * 10);
  }
}
