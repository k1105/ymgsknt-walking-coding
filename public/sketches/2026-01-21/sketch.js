let p1, p2;
let h1, h2;
let activePoint = null;
let input, button;
let currentInputValue = "あ";

function setup() {
  createCanvas(520, 550);
  noFill();
  p1 = {x: 10, y: 20, active: false};
  h1 = {x: 100, y: 300, active: false};
  p2 = {x: 100, y: 400, active: false};
  h2 = {x: 400, y: 20, active: false};
  input = createInput("あ");
  button = createButton("決定");

}

function draw() {
  button.mousePressed(()=>{
    clear();
    currentInputValue = input.value()
  });
  background(255, 10);
  push();
  if(p1.active) {
    fill(0);
  } else {noFill();}
  circle(p1.x, p1.y, 10);
  circle(p2.x, p2.y, 10);
  pop();
  
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
  text(currentInputValue, x, y);
  pop();
  filter(THRESHOLD);
  }


function mouseDragged() {
  
  if(dist(mouseX, mouseY, p1.x, p1.y) < 10) {
    p1.active = true;
    activePoint = p1;
  } else if(dist(mouseX, mouseY, p2.x, p2.y) < 10) {
    p2.active = true;
    activePoint = p2;
  } else if(dist(mouseX, mouseY, h1.x, h1.y) < 10) {
    h1.active = true;
    activePoint = h1;
  } else if(dist(mouseX, mouseY, h2.x, h2.y) < 10) {
    h2.active = true;
    activePoint = h2;
  }
  
  if(activePoint && activePoint.active) {
    clear();
    activePoint.x = mouseX;
    activePoint.y = mouseY;
  }
}

function mouseReleased() {
  if (!activePoint) return;
  activePoint.active = false;
  activePoint = null;
  clear();
}