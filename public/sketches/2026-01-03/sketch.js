const numBox = 200;

function setup() {
  createCanvas(600, 800, WEBGL);
  noStroke();
}

function draw() {
  background(0,0,255);
  push();
  rotateX(millis()/1000);
  for(let i=0; i<numBox; i++) {
  push();
  rotateY(millis()/(100+i*5));
  translate(0,10*(i-numBox/2),20*(i-numBox/2));
  box(100,10,10);
  pop();    
  }
  pop();
}