const {Engine, World, Bodies, Composite} = Matter;
let engine;
let world;
let boxes = [];
let ground;

function setup() {
  createCanvas(600, 600);
  
  engine = Engine.create();
  engine.gravity.y = 0.3;
  world = engine.world;
}

function addBox() {
  let box = Bodies.circle(random(0, width), 0, 15);
  boxes.push(box);
  Composite.add(world, box);
  let options = { isStatic: true};
  ground = Bodies.rectangle(width/2, height-100, width, 40, options);
  Composite.add(world, ground);
}

function draw() {
  background(250);
  Engine.update(engine);
  
  if(frameCount % 3 === 0){
    addBox();
  }
  
  fill(220);
  noStroke();
  boxes.forEach((box, index)=> {
    const pos = box.position;
    const angle = box.angle;
    
    push();
    translate(pos.x, pos.y);
    rotate(angle);
//     rectMode(CENTER);
//     rect(0, 0, 100, 100);
    textAlign(CENTER, CENTER);
    textSize(20);
    const txt = "TIME";
    text(txt[index % txt.length], 0, 0);
    pop();
  });
}