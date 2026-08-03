const r = 10;
const k = 0.9;
const centerPos = {x: 0, y: 0};

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(240);
}

function draw() {
  noStroke();
  fill(0, 0, 0);
  centerPos.x += 10*(noise(frameCount/10)-0.5);
  centerPos.y += 10*(noise(frameCount/10 + 500)-0.5);
  const init_pos = {x: mouseX, y: mouseY};
  const randVal = {x: width/2 * noise(frameCount/100), y: 4 * noise(frameCount/1000)};

  push();
  translate(init_pos.x, init_pos.y);
  rotate(frameCount/1);
  for(let i=0; i<1000; i++) {
    fill(255, noise(frameCount/1000 + i+500)*255, noise(frameCount/1000 + i+200)*255);
    const pos = {x: i, y: i**2 * randVal.y};
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
