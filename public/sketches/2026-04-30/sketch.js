let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(0);
  //   noFill();
  noStroke();
}

function draw() {
  background(0);
  const boxSize = {x: width / 5, y: width / 10, z: width / 10};
  t += PI / 1000;
  rotateZ(t);
  rotateY(t / 2);
  translate(0, -boxSize.y * 5, -boxSize.z * 5);
  //   stroke(255);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      push();
      fill(100 + 255 * noise(millis() / 100 + (i * 1000 + j) * 1000));
      translate(0, i * boxSize.y, j * boxSize.z);
      //   translateY(j);
      rotateZ(PI / 2);
      cylinder(
        (boxSize.x * noise(millis() / 100 + (i * 1000 + j) * 1000)) / 2,
        boxSize.y,

        10,
        10,
      );
      pop();
    }
  }
}
