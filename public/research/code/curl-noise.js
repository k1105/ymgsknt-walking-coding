let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 200; i++) {
    particles.push(createVector(random(width), random(height)));
  }
  background(0);
}

function curlNoise(x, y) {
  let eps = 0.0001;
  let n1 = noise(x, y + eps);
  let n2 = noise(x, y - eps);
  let n3 = noise(x + eps, y);
  let n4 = noise(x - eps, y);
  let dx = (n1 - n2) / (2 * eps);
  let dy = (n3 - n4) / (2 * eps);
  return [dy, -dx];
}

function draw() {
  background(0, 1);
  noStroke();
  fill(255, 80);

  for (let p of particles) {
    let scale = 0.005;
    let [vx, vy] = curlNoise(p.x * scale, p.y * scale);
    p.x += vx * 30;
    p.y += vy * 30;

    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p.set(random(width), random(height));
    }
    ellipse(p.x, p.y, 3);
  }
}
