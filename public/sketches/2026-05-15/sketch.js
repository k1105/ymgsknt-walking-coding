const NUM = 21;
let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function draw() {
  background(0);
  rotateX(millis() / 3000);
  rotateY(millis() / 2000);

  if (floor(millis() / 1000 + 1) % 3 === 0) {
    t = min(1, (millis() / 1000 - floor(millis() / 1000)) * 10);
  } else if (floor(millis() / 1000) % 3 === 0) {
    t = 1 - min(1, (millis() / 1000 - floor(millis() / 1000)) * 10);
  } else {
    t = 0;
  }
  camera(0, 0, 500 - 200 * t);
  translate((-NUM / 2) * 200, (-NUM / 2) * 200, 0);
  for (let i = 0; i < NUM; i++) {
    for (let j = 0; j < NUM; j++) {
      push();
      translate(i * 200, j * 200, 0);
      if (floor(NUM / 2 + 1) == j && floor(NUM / 2 + 1) == i) {
        noStroke();
        fill(255);
        box(100 * (1 + (sin(millis() / 2) / 50) * t ** 2));
      } else {
        noFill();
        stroke(255);
        box(100);
      }
      pop();
    }
  }
}
