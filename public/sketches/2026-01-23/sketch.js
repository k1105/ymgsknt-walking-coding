let lastVal;
let translatePos = {x: 0, y: 0};
const speed = 1/400;
const offset = 0.6;
const freq = (Math.PI/2+offset);
const r = 500;
function setup() {
  createCanvas(450, 750);
  translatePos = {x: width/2, y: height/2};
  noFill();
  stroke(255,0,0);
  background(255,170,0);
}

function draw() {
  const currentVal = floor(millis() * speed / freq);
  if(lastVal !== currentVal) {
    translatePos = {x: random()*width, y: random() * height};
  }
  translate(translatePos.x, translatePos.y);
  circle(0,0,r*cos((millis() * speed) % freq - offset));
  lastVal = currentVal;
}