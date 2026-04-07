let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 200; i++) {
    particles.push(createVector(random(width), random(height)));
  }
  background(0);
}

function draw() {
  background(0, 1);
  noStroke();
  fill(255, 80);

  for (let p of particles) {
    let angle = noise(p.x * 0.005, p.y * 0.005) * TWO_PI * 2;
    p.x += cos(angle);
    p.y += sin(angle);

    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p.set(random(width), random(height));
    }
    ellipse(p.x, p.y, 3);
  }
}
