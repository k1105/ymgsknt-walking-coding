const circleProps = [];
let textId = 0;

function setup() {
  createCanvas(400, 600);
  circleProps.push({x: 0,y: 0,r: 100, t: 0, seed: random()*1000, textId: textId});
  noStroke();
  fill("#EDFF41");
  background(0);
  textAlign(CENTER, CENTER);
  textId = (textId+1)%9;
}

function draw() {
  background("#C5955B");
  push();
  translate(width/2, height/2);
  // rotate(millis()/10000);
  for(let i=0; i<circleProps.length; i++) {
    const c = circleProps[i];
    // const pos = {x:c.x + 50*noise(millis()/1000+c.seed),y: c.y + 50*noise(millis()/1000+c.seed+500)};
    const pos = {x:c.x,y: c.y};
    circle(pos.x, pos.y, c.r * easeOutBounce(c.t));
    if(c.t < 1) c.t += 0.05;
    push();
    fill(0);
    textSize(20 * easeOutBounce(c.t));
    translate(pos.x, pos.y);
    rotate(100*noise(c.seed));
    textStyle(BOLD);
    if(c.r > 40) text("PACKPARTY"[c.textId], 0, 0);
    pop();
  }
  pop();
  
//   const r = random()*height;
//   const theta = random()*TWO_PI;
  
//   createNewCircle(r*cos(theta),r*sin(theta));
  
  createNewCircle(random(-width/2, width/2), random(-height/2, height/2))
  
  if(circleProps.length > 100) circleProps.shift();
  // filter(BLUR, 3);
  // filter(THRESHOLD);
  
//   push();
//   fill(0);
//   textSize(100);
//   textStyle(BOLD);
//   translate(width/2, height/2);
//   text("Pack\nParty", 0,0);
//   pop();
}

function createNewCircle(x, y) {
  const init_min_candidates = [dist(x,y,x,-height/2),dist(x,y,-width/2,y),dist(x,y,x,height/2),dist(x,y,width/2,y)];
  init_min_candidates.sort((a,b) => a - b);
  let min_r = init_min_candidates[0]/2;
  
 for(const c of circleProps) {
   const r = dist(c.x, c.y, x, y) - c.r/2;
   if(r < 3) return;
   if(r < min_r) min_r = r;
 }
  
  circleProps.push({x: x, y: y, r: 2*min(min_r, 100), t: 0, seed: random()*1000, textId: textId});
  
  textId = (textId + 1) % 9;
}

function easeOutBounce(x) {
const n1 = 7.5625;
const d1 = 2.75;

if (x < 1 / d1) {
    return n1 * x * x;
} else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
} else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
} else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
}
}