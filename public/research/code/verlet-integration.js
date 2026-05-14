class Point {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.oldX = x; this.oldY = y;
    this.pinned = false;
  }
  update() {
    if (this.pinned) return;
    let vx = this.x - this.oldX;
    let vy = this.y - this.oldY;
    this.oldX = this.x;
    this.oldY = this.y;
    this.x += vx;
    this.y += vy + 0.5;
  }
}

class Stick {
  constructor(p1, p2) {
    this.p1 = p1; this.p2 = p2;
    this.length = dist(p1.x, p1.y, p2.x, p2.y);
  }
  apply() {
    let dx = this.p2.x - this.p1.x;
    let dy = this.p2.y - this.p1.y;
    let d = sqrt(dx*dx + dy*dy);
    let diff = (this.length - d) / d / 2;
    let offsetX = dx * diff;
    let offsetY = dy * diff;
    if (!this.p1.pinned) { this.p1.x -= offsetX; this.p1.y -= offsetY; }
    if (!this.p2.pinned) { this.p2.x += offsetX; this.p2.y += offsetY; }
  }
}

let points = [];
let sticks = [];

function setup() {
  createCanvas(800, 800);
  for (let i = 0; i < 20; i++) {
    let p = new Point(100 + i * 30, 100);
    if (i === 0) p.pinned = true;
    points.push(p);
  }
  for (let i = 0; i < points.length - 1; i++) {
    sticks.push(new Stick(points[i], points[i + 1]));
  }
}

function draw() {
  background(255);
  for (let p of points) p.update();
  for (let i = 0; i < 10; i++) {
    for (let s of sticks) s.apply();
  }
  stroke(0);
  for (let s of sticks) line(s.p1.x, s.p1.y, s.p2.x, s.p2.y);
}
