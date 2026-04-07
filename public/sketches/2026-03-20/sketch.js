function setup() {
  createCanvas(400, 700, WEBGL);
  noStroke();
}

function draw() {
  background(0);
  rotateX(frameCount/100);
  for(let i=0; i<20; i++) {
  box(10);
  translate(0,100,0);    
  }
  
}