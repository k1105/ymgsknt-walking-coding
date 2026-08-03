const r = 10;
const k = 0.9;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(240);
}

function draw() {
  orbitControl();
  noStroke();
  fill(0, 0, 0);
  const init_pos = {x: 0, y: 0};
  const randVal = {x: width/2 * noise(frameCount/100), y: 4 * noise(frameCount/1000)};

  push();
  translate(init_pos.x, init_pos.y);
  rotate(frameCount/1);
  for(let i=0; i<1000; i++) {
    fill(255, noise(frameCount/1000 + i+500)*255, noise(frameCount/1000 + i+200)*255);
    const pos = {x: i, y: i**2 * randVal.y};
    if(abs(pos.x) > 0) {
    push();
      translate(pos.x, -pos.y, 0);
      sphere(r*k**i);
    pop();
    rotate(0.1);
    push();
      translate(-pos.x, -pos.y, 0);
      sphere(r*k**i);
    pop();
    rotate(0.1);
    push();
      translate(pos.x, pos.y, 0);
      sphere(r*k**i);
    pop();
    rotate(0.1);
    push();
      translate(-pos.x, pos.y, 0);
      sphere(r*k**i);
    pop();
    }
  }
  pop();
    
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
