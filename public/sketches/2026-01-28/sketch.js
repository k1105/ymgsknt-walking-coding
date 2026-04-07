const BPM = 100;
let rectSize = 20;
let rectSlider;
let gridSize = 10;
let gridStep = 60;
const gridOffsets = [];

function setup() {
  createCanvas(400, 600, WEBGL);
  noStroke();
  for(let i=0; i<gridSize**2; i++) {
    gridOffsets.push(random());
  }
}

function draw() {
  const t = frameCount / 60;
  const beat = t * BPM / 60;
  const zigzag = abs(beat%2 - 1);
  rotate(millis()/10000);
  rotateY(millis()/10000);
  rectMode(CENTER);
  background(0);
  for(let i=-gridSize/2; i< gridSize/2; i++) {
    push();
    translate(gridStep*i,0,gridOffsets[floor(i+gridSize/2)]*500);
    for(let j=-gridSize/2; j< gridSize/2; j++) {
      push();
        translate(0,gridStep*j,gridOffsets[floor(i+j+gridSize)]*500);
        box(rectSize*d3.easeElasticOut(zigzag)+10,rectSize);
      pop();
        }
    pop();
  }

}