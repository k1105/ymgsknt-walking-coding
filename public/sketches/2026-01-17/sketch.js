const scatterScale = 300;
const shapeScale = 500;
const translateSpeed = 1/10000;
const shapeMoveSpeed = 1/1000;

function setup() {
  createCanvas(400, 600);
  noStroke();
  fill(0);
}

function draw() {
  background(255, 10);
  for(let i=0; i<3; i++) {
    push();
     translate(width/2 + scatterScale*(noise(millis() * translateSpeed + i*2000)-0.5), height/2 + scatterScale*(noise(millis() * translateSpeed + i*5000)-0.5));
    beginShape();
    vertex((noise(millis()*shapeMoveSpeed + 100 + i*1000)-0.5)*shapeScale,(noise(millis()*shapeMoveSpeed + 300 +  i*1000)-0.5)*shapeScale);
    vertex((noise(millis()*shapeMoveSpeed + 500 +  i*1000)-0.5)*shapeScale,(noise(millis()*shapeMoveSpeed + 700 +  i*1000)-0.5)*shapeScale);
    vertex((noise(millis()*shapeMoveSpeed + 900 +  i*1000)-0.5)*shapeScale,(noise(millis()*shapeMoveSpeed + 1100 +  i*1000)-0.5)*shapeScale);
    endShape();
    pop();
  }
  
  filter(BLUR, 5*(sin(millis()/100)+1)/2);
}