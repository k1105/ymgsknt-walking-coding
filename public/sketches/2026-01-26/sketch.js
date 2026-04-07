function setup() {
  createCanvas(500, 600);
  background(255,10,10);
  noFill();
  stroke(255);
}

function draw() {
  background(255,10,10,1);
  // rotate(millis()/100);
  translate(width/2, height/2);
  rotate(millis()/1000);
  ellipse(0,0,500*noise(millis()/1000),300*sin(millis()/1000));
}