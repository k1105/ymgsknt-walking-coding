let p1, p2;
let h1, h2;

function setup() {
  createCanvas(520, 550);
  noFill();
  p1 = {x: 10, y: 20};
  h1 = {x: 100, y: 300};
  p2 = {x: 100, y: 400};
  h2 = {x: 400, y: 20};
}

function draw() {
  background(255, 1);
  circle(p1.x, p1.y, 10);
  circle(p2.x, p2.y, 10);
  
  push();
  fill(0);
  circle(h1.x, h1.y, 10);
  circle(h2.x, h2.y, 10);
  pop();
  
  line(p1.x, p1.y, h1.x, h1.y);
  line(p2.x, p2.y, h2.x, h2.y);

    bezier(
      p1.x,
      p1.y,
      h1.x,
      h1.y,
      h2.x,
      h2.y,
      p2.x,
      p2.y,
    );
  
  const t = millis()/3000 % 1;
  
  const x = bezierPoint(p1.x, h1.x, h2.x, p2.x, t);
  const y = bezierPoint(p1.y, h1.y, h2.y, p2.y, t);
  
  push();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(40 * min((-cos(t*TWO_PI)+1.5)/2, 1));
  text("い", x, y);
  pop();

  }
