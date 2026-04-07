const speed = 1/200;
let rot = 0;
let pos = {x: 0, y: 0};

function setup() {
  createCanvas(400, 600);
}

function draw() {
  background(255, 50);
  translate(width/2, height/2);
  
  rot += (noise(millis()/1000)-0.5)/10;
  // pos.x += 2*(noise(millis()/1000+1000)-0.5);
  // pos.y += 2*(noise(millis()/1000+2000)-0.5);
  
  push();
  rotate(rot);
  fill(0, 255*(sin(millis()*speed+PI)+3)/4)
  translate(pos.x, pos.y);
  textSize(200*(sin(millis()*speed+PI)+2)/3);
  textAlign(CENTER, CENTER);
  text("Y", 0, 0);
  pop();
  
  filter(BLUR, 1+10*(sin(millis()*speed)+1)/2);
}