const dist = 50;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  background(0);
}

function draw() {
  background(0,100);
  translate(width/2, height/2);
  rotate(PI*(frameCount/100));
  for(let i=0; i<200; i++) {
    rotate(PI*sin(i+frameCount/1000));
    fill(i*2);
    for(let j=0; j<i; j++) {
      circle((noise(frameCount/1000+i+j)-0.5)*i**2/10,-(noise(frameCount/1000+i+j+500))*10*i,i/3*noise(i+frameCount/100));
    }
          
  }

}

