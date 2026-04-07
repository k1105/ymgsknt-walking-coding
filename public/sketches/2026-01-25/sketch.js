const charProps = [];

const scatterScale = 500;
const shapeScale = 700;
const translateSpeed = 1/10000;
const shapeMoveSpeed = 1/100;
let currentStep = 0;
let t = 0;

function setup() {
  createCanvas(400, 600);
  noStroke();
  fill(100, 200, 255);
  for(const c of "PackParty") {
    charProps.push({c: c, x: random(-width/3, width/3), y: random(-height/3, height/3), n_x: 0, n_y: 0, t: 0, seed: random(0,1000)});
  }
  
  textAlign(CENTER, CENTER);
}

function draw() {
  background(255, 100);
  const bt = min(easeOutBounce(t*1.5), 1);
  const ct = easeOutCubic(t);
  textSize(100*(sin(PI*bt)+4)/5);
  
  for(const c of charProps) {
    push();
    translate(width/2, height/2);
    rotate(TWO_PI*noise(c.seed));
    text(c.c,c.x*(1-ct) + c.n_x*ct,c.y*(1-ct)+c.n_y*ct);
    if(floor(millis()*shapeMoveSpeed / TWO_PI) !== currentStep) {
      c.x = c.n_x;
      c.y = c.n_y;
      c.n_x = random(-width/3, width/3);
      c.n_y = random(-height/3, height/3);
    }
    pop();
  }
  
  filter(BLUR, 5*(sin(TWO_PI*bt-PI/2)+1)/2);
  
  t = ((millis()*shapeMoveSpeed) % TWO_PI) / TWO_PI;
  
  currentStep = floor(millis()*shapeMoveSpeed / TWO_PI);
  
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

function easeOutCubic(x) {
return 1 - Math.pow(1 - x, 3);
}