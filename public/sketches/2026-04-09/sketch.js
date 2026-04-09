let points = [];
const num = 500;

function setup() {
  createCanvas(innerWidth, innerHeight);
  for (let i = 0; i < num; i++) {
    points.push([random(width), random(height)]);
  }
}

function draw() {
  background(255);

  let delaunay = d3.Delaunay.from(points);
  let voronoi = delaunay.voronoi([0, 0, width, height]);

  stroke(0);
  strokeWeight(1);
  strokeJoin(ROUND);
  noFill();
  for (let i = 0; i < num; i++) {
    const x = points[i][0];
    const y = points[i][1];

    let angle = noise(x * 0.005, y * 0.005) * TWO_PI * 2;
    points[i][0] += cos(angle);
    points[i][1] += sin(angle);

    if (
      points[i][0] < 0 ||
      points[i][0] > width ||
      points[i][1] < 0 ||
      points[i][1] > height
    ) {
      points[i] = [random(width), random(height)];
    }

    // circle(points[i][0], points[i][1], 10);
    let cell = voronoi.cellPolygon(i);
    if (!cell) continue;
    beginShape();
    for (let [x, y] of cell) {
      vertex(x, y);
    }
    endShape(CLOSE);
  }
}
