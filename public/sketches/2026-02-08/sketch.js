class Node {
  constructor(r, theta, parentNode, level) {
    this.r = r;
    this.theta = theta;
    this.x = r*cos(theta);
    this.y = r*sin(theta);
    this.parentNode = parentNode;
    this.level = level
  }
  
  setPolarCoord(r, theta) {
    this.r = r;
    this.theta = theta;
    this.x = r*cos(this.theta);
    this.y = r*sin(this.theta);
  }
}

const nodes = [];

function setup() {
  createCanvas(400, 600);
  stroke(255);
  
  for(let i=0; i<10; i++) {
    const k = 20;
    if(i==0) {
      const n = new Node(0, 0, null, 0);
      nodes.push(n);
    }
    for(let j=0; j<i**2; j++) {
      const p_n = nodes[i-1];
      const r = i*k + 30*noise(i+j);
      const theta = i == 1 ? random()*TWO_PI : p_n.theta + random()*PI;
      const n = new Node(r, theta, p_n, i);
      nodes.push(n);
    }

  }
  
  background(0);
}

function draw() {
  background(0);
  translate(width/2, height/2);
  nodes.forEach((n, index)=> {
    n.setPolarCoord(n.r, n.theta + (noise(millis()/1000 - index*10)-0.5)/100);
    push();
    noStroke();
    // fill(255,40*(10-n.level));
    circle(n.x, n.y, 2**2*(10-n.level)+10*d3.easeElasticOut(((millis()+5*index)/1000) % 1));
    pop();
    if(n.parentNode !== null) {
      const p_n = n.parentNode;
      push();
      stroke(255, 40*(10-n.level));
      // line(p_n.x, p_n.y, n.x, n.y);
      pop();
    }
  });
  filter(BLUR, max(3*sin(millis()/500), 0));
  filter(THRESHOLD);
}