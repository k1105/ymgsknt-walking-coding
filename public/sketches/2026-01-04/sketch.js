function setup() {
  createCanvas(600, 600, WEBGL);
  noStroke();
}

function draw() {
  background(0);
  for(let i=0; i<100; i++) {
    for(let j=0; j<50; j++) {
      push();
      const theta = (millis()- i*20)/400;
      const phi = millis() / 1000;
      rotateX(phi + TWO_PI/100 * j);
      rotateY(phi + TWO_PI/100 * j);
      translate(200 * cos(theta),200 * sin(theta),0);
      sphere(1);
      pop();
    }
  }
}