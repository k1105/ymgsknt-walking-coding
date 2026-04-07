class BezierProps {
  constructor(p1, p2, h1, h2, brushTxt="あ") {
    this.p1 = p1;
    this.p2 = p2;
    this.h1 = h1;
    this.h2 = h2;
    this.activePoint = null;
    this.brushTxt = brushTxt;
  }
  
  checkActiveControl() {
    if(dist(mouseX, mouseY, this.p1.x, this.p1.y) < 10) {
      this.p1.active = true;
      this.activePoint = this.p1;
  } else if(dist(mouseX, mouseY, this.p2.x, this.p2.y) < 10) {
    this.p2.active = true;
    this.activePoint = this.p2;
  } else if(dist(mouseX, mouseY, this.h1.x, this.h1.y) < 10) {
    this.h1.active = true;
    this.activePoint = this.h1;
  } else if(dist(mouseX, mouseY, this.h2.x, this.h2.y) < 10) {
    this.h2.active = true;
    this.activePoint = this.h2;
  }
  }
  
  setBrushText(c) {
    this.brushTxt = c;
  }
}

const beziers = [];

function setup() {
  createCanvas(520, 750);
  noFill();
  for(let i=0; i<5; i++) {
    const b1 = new BezierProps({x: width*random(), y: height*random(), active: false}, {x: width*random(), y: height*random(), active: false}, {x: width*random(), y: height*random(), active: false}, {x: width*random(), y: height*random(), active: false}, "愛");
    beziers.push(b1);    
  }

}

function draw() {
  background(255, 10);
  for( const b of beziers) {
    drawControl(b.p1, b.p2, b.h1, b.h2);
    drawBrush(b.p1, b.p2, b.h1, b.h2, b.brushTxt);    
  }

  filter(THRESHOLD);
  }


function mouseDragged() {
  for(const b of beziers) {
    b.checkActiveControl();
  
    if(b.activePoint && b.activePoint.active) {
      clear();
      b.activePoint.x = mouseX;
      b.activePoint.y = mouseY;
    }
  }
}

function mouseReleased() {
  for(const b of beziers) {
    if (!b.activePoint) return;
    b.activePoint.active = false;
    b.activePoint = null;
    clear();
  }
}

function drawControl(p1, p2, h1, h2) {
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
}

function drawBrush(p1, p2, h1, h2, txt) {
  const t = millis()/3000 % 1;
  
  const x = bezierPoint(p1.x, h1.x, h2.x, p2.x, t);
  const y = bezierPoint(p1.y, h1.y, h2.y, p2.y, t);
  
  push();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(40 * min((-cos(t*TWO_PI)+1.5)/2, 1));
  text(txt, x, y);
  pop();
}