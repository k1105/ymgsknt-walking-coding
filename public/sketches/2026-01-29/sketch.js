const BPM = 60;
let kanban;

function preload() {
  kanban = loadImage("kanban.png");
}

function setup() {
  createCanvas(400, 600, WEBGL);
  background(0,0,255);
}

function draw() {
  const t = frameCount / 60;
  const beat = max((t * BPM) % 60 / 60, 0.01);
  background(0,0,255);
  rotateY(radians(millis()/60));
  rotateX((1-d3.easeElasticOut(beat))/3);
  rotateZ((1-d3.easeElasticOut(beat))/3);
  imageMode(CENTER);
  const s = d3.easeElasticOut(beat) / 5;
  image(kanban, 0,0,kanban.width * s, kanban.height * s);
}
