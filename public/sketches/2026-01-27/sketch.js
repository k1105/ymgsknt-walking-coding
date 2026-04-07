const numBox = 200;

function setup() {
  createCanvas(600, 800, WEBGL);
  // noFill();
  noStroke();
}

function draw() {
  background(0);
  push();
  rotateX(millis()/3000);
  for(let i=0; i<numBox; i++) {
  push();
  rotateY(millis()/(100+i*5));
  translate(0,10*(i-numBox/2),20*(i-numBox/2));
  box(1000,1,1);
  pop();    
  }
  pop();
  filter(BLUR, 1);
  filter(THRESHOLD)
}