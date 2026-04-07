function setup() {
  createCanvas(400, 600);
}

function draw() {
  background(0);
  const s = frameCount / 100;
  const p1 = {x: width*0.5, y: height*0.5};
   const p2 = {x: width*noise(s + 400), y: height*noise(s + 600)};
   const p3 = {x: width*noise(s + 800), y: height*noise(s + 1000)};
   const p4 = {x: width*noise(s + 1200), y: height*noise(s + 1400)};
  
  lineWithCircle(p1.x,p1.y, p2.x, p2.y);
  lineWithCircle(p2.x,p2.y, p3.x, p3.y);
  lineWithCircle(p3.x,p3.y, p4.x, p4.y);
  lineWithCircle(p1.x,p1.y, p4.x, p4.y);
}

function lineWithCircle(x1, y1, x2, y2) {
  const detailness = 100;
  noStroke();
  for(let i=0; i<detailness; i++) {
    fill(i/detailness*255)
    const x = x1*(1-i/detailness) + x2*i/detailness;
    const y = y1*(1-i/detailness) + y2*i/detailness;
    circle(x, y, 10*noise(i));
  }
}