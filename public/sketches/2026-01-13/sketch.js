let points = [[20,30],[200,390],[370,160], [200,300]];
let moveDirection = [1, 1, 1];
const NUM = 10;

function setup() {
  createCanvas(400, 600);
  noStroke();
}

function draw() {
  background(0);
  for(let j = 0; j < points.length; j++) {
    const c_p = points[j];
    const n_p = points[(j+1)%points.length];
    for(let i = 0; i<NUM; i++) {
      circle(c_p[0]*(1-i/NUM)+n_p[0]*i/NUM, c_p[1]*(1-i/NUM)+n_p[1]*i/NUM, 30*noise(millis()/10+(j+1)*(i+1)));
    }
  }
  if(points[0][1] >= height || points[0][1] <= 0) {
    moveDirection[0] *= -1;
  }
  
  if(points[1][0] >= width || points[1][0] <= 0) {
    moveDirection[1] *= -1;
  }
  
  if(points[2][1] >= height || points[2][1] <= 0) {
    moveDirection[2] *= -1;    
  }
  
  points[0][1] += moveDirection[0];
  points[1][0] += moveDirection[1];
  points[2][1] += moveDirection[2];

 }