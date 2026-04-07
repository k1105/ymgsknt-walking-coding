function setup() {
  createCanvas(400, 600, WEBGL);
  noFill();
  stroke(255);
}

function draw() {
  background(0);
  push();
  sphere(100);
  translate(300,0,0);
  sphere(100*cos(frameCount/30));
  translate(-600,0,0);
  sphere(100*cos(frameCount/30));
  pop();
  camera(500*cos(frameCount/10),500*sin(frameCount/10),1000*sin(millis() /500),0,0,0);
}