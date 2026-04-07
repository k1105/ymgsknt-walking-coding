const pos = [];
const NUM = 100;
const exp = d3.easePolyOut.exponent(6);

function setup() {
  createCanvas(500, 650);
  background(0);
  stroke(255, 0 ,10);
  // strokeWeight(10);
  for(let i=0; i<NUM; i++) {
    pos.push({x: 0, y: 0});
  }
}

function draw() {
  translate(width/2, height);
  for(let i=0; i<NUM; i++) {
    push();
    const k = 5*(height + pos[i].y) / height + 0.5;
    pos[i].x = exp(-pos[i].y/height)*1.5*width*(noise(frameCount/1000+i)-0.5);
    pos[i].y -= noise(frameCount/1000+i+200) * k;
    // fill(255*(height+pos[i].y)/height);
    stroke(255, (-pos[i].y/height) * 100, (-pos[i].y/height) * 100);
    circle(pos[i].x, pos[i].y,70*(1+pos[i].y/height));
    pop();
  }
  
  blendMode(SCREEN)
  
  fill(255,0,0);
  rect(0,0,width,height);

}