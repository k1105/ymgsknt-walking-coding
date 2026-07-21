const r = 10;
const k = 0.9;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(240);
}

function draw() {
  noStroke();
  fill(0, 0, 0);
  const init_pos = {x: width/2, y: height};
  
  for(let i=0; i<100; i++) {
    circle(init_pos.x + i * random(width/2), init_pos.y - i**2 * random(4), r*k**i);
    circle(init_pos.x - i * random(width/2), init_pos.y - i**2 * random(4), r*k**i);
  }
    
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
