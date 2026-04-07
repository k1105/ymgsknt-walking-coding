const {Engine, World, Bodies, Composite} = Matter;
const BPM = 240;

let engine;
let world;
let boxes = [];
let ground;

function setup() {
  createCanvas(600, 600);
  
  engine = Engine.create();
  world = engine.world;
}

function addBox() {
  let box = Bodies.circle(random(0, width), 0, 15);
  boxes.push(box);
  Composite.add(world, box);
  let options = { isStatic: true};
  ground = Bodies.rectangle(width/2, height-100, width-100, 40, options);
  Composite.add(world, ground);
  
}

function draw() {
  background(250, 200);
  Engine.update(engine);
  
  if(frameCount % 3 === 0){
    addBox();
  }
  
  // if(frameCount % 1000 === 0) {
  //   if(ground) {
  //     Composite.remove(world, ground);
  //     ground = null;      
  //   } else {
  //     let options = { isStatic: true};
  //     ground = Bodies.rectangle(width/2, height-20, width, 40, options);
  //     Composite.add(world, ground);
  //   }}
  
  fill(0,255,0);
  noStroke();
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
    textSize(40);
    const txt = "InstituteofAdvancedMediaArtsandSciences";
    text(txt[index % txt.length], 0, 0);
    pop();
  });
}