const BPM = 10;
let rectSize = 20;
let rectSlider;
let gridSize = 10;
let gridStep = 60;
const gridOffsets = [];

function setup() {
  createCanvas(400, 600);
  noStroke();
  for(let i=0; i<gridSize**2; i++) {
    gridOffsets.push(random());
  }
  background(0);
}

function draw() {
  background(0,1);
  const t = frameCount / 60;
  const beat = t * BPM / 60;
  const zigzag = abs(beat%2 - 1);
  translate(width/2, height/2);
  circle((100*millis()/1000)%width-width/2, 100-100*d3.easeBounceIn(zigzag), 10);
  circle((100*millis()/500)%width-width/2, 100-200*d3.easeBounceInOut(zigzag), 10);
  circle((100*millis()/2000)%width-width/2, 100-200*d3.easeElasticOut(zigzag), 10);
}