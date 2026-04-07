const bpm = 120;
const NUM = 37;
const R = 100;

function setup() {
  createCanvas(400, 600);
  noStroke();
  background(0);
}

function draw() {
  const t = millis()/1000;
  const beat = (t % (60 / bpm)) / (60 / bpm);
  const zigzag = abs(beat-0.5)*2;
  background(0,100);
  translate(width/2, height/2);
  rotate(millis()/1000);
  
  for(let i=-NUM/2; i<NUM/2; i++) {
    for(j=-NUM/2; j<NUM/2; j++) {
      circle(20*i,20*j,zigzag*R*noise(i*j+frameCount*10));
    }
  }
}