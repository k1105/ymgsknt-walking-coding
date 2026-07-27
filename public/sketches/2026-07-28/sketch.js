const r = 1;
const k = 1;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(240);
}

function draw() {
  noStroke();
  fill(0, 0, 0);
  const init_pos = {x: width/2, y: height/2};
  const randVal = {x: width/2 * noise(frameCount/100), y: 4 * noise(frameCount/100)};

  push();
  translate(init_pos.x, init_pos.y);
  rotate(frameCount/1000);
  for(let i=0; i<1000; i++) {
    const pos = {x: i * randVal.x, y: i**2 * randVal.y};
    if(abs(pos.x) > 0) {
    circle(pos.x, -pos.y, r*k**i);
    rotate(0.1);
    circle(-pos.x, -pos.y, r*k**i);
    rotate(0.1);
    circle(pos.x, pos.y, r*k**i);
    rotate(0.1);
    circle(-pos.x, pos.y, r*k**i);      
    }
  }
  pop();
    
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
