let boids = [];

class Boid {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(2);
  }

  flock(boids) {
    let sep = createVector(), ali = createVector(), coh = createVector();
    let countSep = 0, countAli = 0, countCoh = 0;

    for (let other of boids) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (other === this || d > 50) continue;

      if (d < 25) {
        let diff = p5.Vector.sub(this.pos, other.pos).div(d);
        sep.add(diff);
        countSep++;
      }

      ali.add(other.vel);
      countAli++;

      coh.add(other.pos);
      countCoh++;
    }

    if (countSep) sep.div(countSep).setMag(2).sub(this.vel).limit(0.05);
    if (countAli) ali.div(countAli).setMag(2).sub(this.vel).limit(0.05);
    if (countCoh) {
      coh.div(countCoh).sub(this.pos).setMag(2).sub(this.vel).limit(0.05);
    }

    this.vel.add(sep).add(ali).add(coh).limit(2);
  }

  update() {
    this.pos.add(this.vel);
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }
}

function setup() {
  createCanvas(800, 800);
  for (let i = 0; i < 200; i++) boids.push(new Boid());
}

function draw() {
  background(0, 30);
  for (let b of boids) b.flock(boids);
  for (let b of boids) {
    b.update();
    fill(255);
    noStroke();
    circle(b.pos.x, b.pos.y, 4);
  }
}
