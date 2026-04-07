const {Engine, World, Bodies, Composite} = Matter;
const BPM = 240;

let engine;
let world;
let boxes = [];
let ground;

function setup() {
  createCanvas(400, 600);
  
  engine = Engine.create();
  world = engine.world;
  
  let options = { isStatic: true};
  ground = Bodies.rectangle(width/2, height-20, width, 40, options);
  
  Composite.add(world, ground);
}

function mousePressed() {
  let box = Bodies.rectangle(mouseX, mouseY, 40, 40);
  boxes.push(box);
  Composite.add(world, box);
}

function draw() {
  background(250);
  Engine.update(engine);
  
  fill(0);
  stroke(0);
  boxes.forEach((box, index)=> {
    const t = (frameCount+index) / 60;
    const beat = t * BPM / 60;
    const zigzag = abs(beat%2 - 1);
    const pos = box.position;
    const angle = box.angle;
    
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    rectMode(CENTER);
    rect(0, 0, 40 + 10*d3.easeElasticOut(zigzag), 40 + 10*d3.easeElasticOut(zigzag));
    pop();
  });
}