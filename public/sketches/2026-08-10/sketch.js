const dist = 50;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
}

function draw() {
  background(0, 10);

  for(let j=0; j<120; j++) {
      for(let i=0; i<width/dist; i++) {
        push();
          // fill(255*noise(i,j),100,100);
          translate(width/2, height/2);
          rotate(noise(frameCount/1000+i+j));
          translate(i*dist*cos(j/TWO_PI), i*dist*sin(j/TWO_PI));
          drawSparkle(1,50, 100*noise(i,j), 1/(10+j));    
        pop();
      }
  }


}

const drawSparkle = (outer_r, inner_r, zigzag, speed) => {
  let angleSet = [];
  let angle;
  let bi = 0;
      angleSet = [];
      angle = 0;
  for(let i=0; i<zigzag*2; i++) {
    angle += noise(frameCount*speed + 200*i);
    angleSet.push(angle);
  }

  for(let i=0; i<angleSet.length; i++) {   
    angleSet[i] = angleSet[i]/angle * TWO_PI;
  }
  
  beginShape();
  for(let i=0; i<angleSet.length; i++) {
    bi = i % 2;
      if(bi===0) vertex(outer_r*(1+noise(frameCount*speed+500*i))*cos(angleSet[i]), outer_r*(1+noise(frameCount*speed+500*i))*sin(angleSet[i]));
    if(bi===1) vertex(inner_r*cos(angleSet[i]), inner_r*sin(angleSet[i]));
  }
  endShape(CLOSE);
}