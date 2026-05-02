let nodes = [];
const REPULSION_R = 20;
const MAX_EDGE = 10;

function setup() {
  createCanvas(800, 800);
  for (let i = 0; i < 30; i++) {
    let a = (i / 30) * TWO_PI;
    nodes.push(createVector(400 + cos(a) * 50, 400 + sin(a) * 50));
  }
}

function draw() {
  background(255);

  // 1. Repulsion
  for (let i = 0; i < nodes.length; i++) {
    let force = createVector(0, 0);
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      let d = p5.Vector.dist(nodes[i], nodes[j]);
      if (d < REPULSION_R) {
        let dir = p5.Vector.sub(nodes[i], nodes[j]).normalize();
        force.add(dir.mult((REPULSION_R - d) * 0.05));
      }
    }
    nodes[i].add(force);
  }

  // 2. Alignment (midpoint of neighbors)
  let next = nodes.map((n, i) => {
    let prev = nodes[(i - 1 + nodes.length) % nodes.length];
    let nxt = nodes[(i + 1) % nodes.length];
    let mid = p5.Vector.add(prev, nxt).mult(0.5);
    return p5.Vector.lerp(n, mid, 0.05);
  });
  nodes = next;

  // 3. Subdivision
  for (let i = nodes.length - 1; i >= 0; i--) {
    let nxt = nodes[(i + 1) % nodes.length];
    if (p5.Vector.dist(nodes[i], nxt) > MAX_EDGE) {
      let mid = p5.Vector.add(nodes[i], nxt).mult(0.5);
      nodes.splice(i + 1, 0, mid);
    }
  }

  // Draw
  noFill();
  stroke(0);
  beginShape();
  for (let n of nodes) vertex(n.x, n.y);
  endShape(CLOSE);
}
