const pos = [];

let x = 0;
let y = 0;
const SPEED = 1/100;
const NUM = 100;

function setup() {
  createCanvas(400, 600);
  background(0);
  noStroke();
  
  for(let i=0; i<NUM; i++) {
    pos.push({x: random(-0.5, 0.5)*width, y: random(-0.5, 0.5)*height});
  }
}

function draw() {
  background(0,0);
  translate(width/2, height/2);
  for(let i=0; i<pos.length; i++) {
      pos[i].x += noise(frameCount * SPEED + i*100)-0.5;
      pos[i].y += noise(frameCount * SPEED+i*100+1000)-0.5;
      circle(pos[i].x, pos[i].y, 10*noise(frameCount * SPEED + i*100+10000));
  }

}