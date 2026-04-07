const BPM = 160;
let p1, p2, h1, h2;

function setup() {
  createCanvas(420, 700);
  p1 = {x: -width/2+20,y: 0};
  p2 = {x: width/2-20,y: 0};
  h1 = {x: 0, y: 0};
  h2 = {x: 0, y: 0};
  // noStroke();
  noFill();
  stroke(255);
  strokeWeight(1);
  background(0);

}

function draw() {
  translate(width/2, height/2);
  const t = frameCount / 60;
  const beat = t * BPM / 60;
  const zigzag = abs(beat%2 - 1);

  background(0);
  for(let i=0; i<TWO_PI; i+=PI/100) {
  push();
    rotate(i);
    translate(0, 50);
    bezier(p1.x, p1.y,h1.x, h1.y, h2.x, h2.y, p2.x, p2.y);  
  pop();
  }
  // circle(h1.x, h1.y, 10);
  // circle(h2.x, h2.y, 10);
  // circle(p1.x, p1.y, 10);
  // circle(p2.x, p2.y, 10);
  h2.x = 100*(1-d3.easeBackOut(zigzag));
  h2.y = 50*(1-d3.easeElasticOut(zigzag));
}