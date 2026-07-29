const r = 1;
const k = 1;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(240);
}

function draw() {
  // background(255,1);
  noStroke();
  fill(255*sin(PI*frameCount/100));
  const init_pos = {x: width/2, y: height/2};
  const randVal = {x: width/2 * noise(frameCount/100), y: noise(frameCount/500)/100};
  push();
  translate(init_pos.x + width/2*sin(frameCount/100), init_pos.y);
  rotate(frameCount/100);
  for(let i=0; i<1000; i++) {
    const pos = {x: i, y: i**2 * randVal.y };
    if(abs(pos.x) > 0) {
    circle(pos.x, -pos.y, r*k**i);
    circle(-pos.x, -pos.y, r*k**i);
    circle(pos.x, pos.y, r*k**i);
    circle(-pos.x, pos.y, r*k**i);      
    }
  }
  pop();
    
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
