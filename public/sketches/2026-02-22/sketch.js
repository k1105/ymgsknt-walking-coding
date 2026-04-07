function setup() {
  createCanvas(400, 700);
  strokeWeight(2);
}

function draw() {
  background(0);
  translate(-50, -50)
  for(let j=1; j<100; j++) {
    for(let i=50; i<=width+50; i+=10) {
      circle(i,30*(sin(frameCount/100))*j*sin(i/width * PI/2)+50*cos(i/width * 4*PI)+height/2, 10);
    }    
  }
}