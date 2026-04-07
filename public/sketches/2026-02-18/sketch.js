const {Engine, World, Bodies, Composite} = Matter;
const BPM = 240;

let engine;
let world;
let boxes = [];
let ground;
let flag = false;

function setup() {
  createCanvas(800, 600);
  
  engine = Engine.create();
  world = engine.world;
}

function addBox() {
  let box = Bodies.rectangle(random(0, width), 0, 80, 80);
  boxes.push(box);
  Composite.add(world, box);
}

function draw() {
  background(250, 140);
  Engine.update(engine);
  
  if(frameCount % 3 === 0){
    addBox();
  }
  
  if(frameCount % 300 === 0) {
    if(ground) {
      Composite.remove(world, ground);
      ground = null;      
    } else {
      let options = { isStatic: true};
      ground = Bodies.rectangle(width/2, height-20, width, 40, options);
      Composite.add(world, ground);
    }

  }
  
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
//     rectMode(CENTER);
//     rect(0, 0, 100, 100);
    textAlign(CENTER, CENTER);
    textSize(100);
    const txt = "Yamagishi Kanata";
    text(txt[index % txt.length], 0, 0);
    pop();
  });
}