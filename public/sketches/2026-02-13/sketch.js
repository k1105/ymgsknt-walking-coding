

function setup() {
  createCanvas(400, 700);
  background(0);
  stroke(255, 0 ,10);
}

function draw() {
  // background(220, 10);
  translate(width/2, height);
  for(let i=0; i<100; i++) {
    push();
    const y = -frameCount*noise(frameCount/1000+i+200);
    stroke(255, (-y/height) * 100, (-y/height) * 100);
    circle((1-y/height)*width*(noise(frameCount/1000+i)-0.5),y,10*(1+y/height));
    pop();
  }

}