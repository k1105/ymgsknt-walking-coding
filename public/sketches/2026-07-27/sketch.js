const r = 8;
const k = 0.9;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(240);
}

function draw() {
  noStroke();
  fill(0, 0, 0);
  const init_pos = {x: width/2, y: height/2};
  const randVal = {x: width/2 * noise(frameCount/100), y: 4 * noise(frameCount + 500)};

  push();
  translate(init_pos.x, init_pos.y);
  rotate(frameCount/100);
  for(let i=0; i<1000; i++) {
    const pos = {x: i * randVal.x, y: i**2 * randVal.y};
    circle(pos.x, - pos.y, r*k**i);
    circle(init_pos.x - pos.x, init_pos.y - pos.y, r*k**i);
    circle(init_pos.x + pos.x, init_pos.y + pos.y, r*k**i);
    circle(init_pos.x - pos.x, init_pos.y + pos.y, r*k**i);
  }
  pop();
    
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
