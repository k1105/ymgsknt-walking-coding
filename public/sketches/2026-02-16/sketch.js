const pos = [];
const NUM = 100;
const exp = d3.easePolyOut.exponent(6);

function setup() {
  createCanvas(500, 650);
  background(0);
  stroke(255, 0 ,10);
  // strokeWeight(10);
  for(let i=0; i<NUM; i++) {
    pos.push({x: 0, y: 0, diff: random(0.5, 1)});
  }
}

function draw() {
  translate(width/2, height+30);
  for(let i=0; i<NUM; i++) {
    push();
    const k = 5*(height + pos[i].y) / height + 0.5;
    pos[i].x = exp(-pos[i].y/height)*1.2*width*(noise(frameCount/1000+i)-0.5);
    pos[i].y -= noise(frameCount/1000+i+200) * k;
    // fill(255*(height+pos[i].y)/height);
    stroke(255, (-pos[i].y/height) * 100, (-pos[i].y/height) * 100);
    circle(pos[i].x, pos[i].y,max(70*(pos[i].diff+pos[i].y/height)*(noise(frameCount/100+2000*i)*0.9+0.1), 0));
    pop();
  }
  
  noFill();
  filter(BLUR, 1);
  blendMode(SCREEN)
  
  // fill(255,0,0);
  // rect(0,0,width,height);

}