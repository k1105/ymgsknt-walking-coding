const BPM = 120;
let nodes = [];
let edges = [];
let lastBeat = 0;
const nodeCount = 100;
const k = 0.6;
repulsion = 100;
const damping = 0.5;
const restLength = 100;
let gui;

let params = {
  bpm: 120,
  nodeCount: 50,
  k: 0.6,
  damping: 0.1,
  radius: 13,
  weightVariance: 5,
}

function setup() {
  createCanvas(400, 700);
  background(0);
  noStroke();
  
  gui = new lil.GUI();
  
  gui.add(params, 'bpm', 20, 300).step(1);
  gui.add(params, 'nodeCount', 1, 100).step(1);
  gui.add(params, 'k', 0, 1);
  gui.add(params, 'damping', 0, 1);
  gui.add(params, 'radius', 1, 100);
  gui.add(params, 'weightVariance', 1, 20).step(1);

  resetNetwork();
}

function draw() {
  background(0, 100);
  const t = frameCount / 60;
  const beat = max((t * params.bpm) % 60 / 60, 0.01);
  if(lastBeat > beat) {
    resetNetwork();
  }
  
  lastBeat = beat;
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i+1; j < nodes.length; j++) {
      if(i===j) continue;
      let force = p5.Vector.sub(nodes[i].pos, nodes[j].pos);
      let d = force.mag();
      if (d < 1) d = 1;
      
      let strength = (repulsion * nodes[i].weight * nodes[j].weight) / (d**2);
      force.setMag(strength);
      
      nodes[i].acc.add(force);
      nodes[j].acc.sub(force);
    }
    
    let centerForce = p5.Vector.sub(createVector(width/2, height/2), nodes[i].pos);
    centerForce.mult(0.1);
    nodes[i].acc.add(centerForce);
  }
  
  for(const edge of edges) {
    let n1 = nodes[edge[0]];
    let n2 = nodes[edge[1]];
    let force = p5.Vector.sub(n2.pos, n1.pos);
    let d = max(force.mag(), params.radius * 2);
    let stretch = d - restLength;
    force.setMag(params.k*stretch);
    n1.acc.add(force);
    n2.acc.sub(force);
  }
  
  for(let i=0; i<params.nodeCount; i++) {
    let n = nodes[i]
    let finalAcc = n.acc.div(n.weight);
    n.vel.add(finalAcc);
    n.vel.mult(params.damping);
    n.pos.add(n.vel);
    n.acc.set(0, 0);
  }
  
  push();
  stroke(255);
  noFill();
  for (let edge of edges) {
    if (edge[0] >= params.nodeCount || edge[1] >= params.nodeCount) continue;
    line(nodes[edge[0]].pos.x, nodes[edge[0]].pos.y, nodes[edge[1]].pos.x, nodes[edge[1]].pos.y); }
  pop();
  
  fill(255);
  for(const n of nodes.slice(0, params.nodeCount)) {
    circle(n.pos.x, n.pos.y, params.radius*n.weight/2);
  }
}

function resetNetwork() {
    nodes = [];
    edges = [];
  
    for (let i = 0; i < nodeCount; i++) {
      
      let w = random(1) > 0.9 ? params.weightVariance : 1;
      
    nodes.push({
      pos: createVector(random(width), random(height)),
      vel: createVector(0, 0),
      acc: createVector(0, 0),
      weight: w,
    });
  }

  for (let i = 0; i < nodeCount; i++) {
    edges.push([i, (i + 1) % nodeCount]);
    if (i % 5 === 0) edges.push([0, floor(random(nodeCount))]);
  }
}