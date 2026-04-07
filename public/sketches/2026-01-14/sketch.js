let currentCharsPos = [];
let prevState = -1;

function setup() {
  createCanvas(400, 600);
  fill(255);
  textFont("Shippori Antique B1");
  for(let i=0; i<10; i++) {
    currentCharsPos.push([random(width), random(height)]);
  }
}

function draw() {
  const currentState = floor(4*millis()/100 / PI);
  if(currentState !== prevState) {
    currentCharsPos = [];
    for(let i=0; i<5; i++) {
      currentCharsPos.push([random(width), random(height)]);
    }
  }
  
  prevState = currentState;
  
  background(255*(sin(PI+millis()/100)+1)/2,0,0);
  
  textSize(10);
  for(const p of currentCharsPos) {text("踊", p[0], p[1]);}
  translate(width/4, height/4);
  for(let i=40; i<50; i++) {
  push();
  textAlign(CENTER);
  const ts = 50+i*10*(sin(i/50 * PI + millis()/100)+1)/2;
  translate(0,ts/2);
  textSize(ts);
  text("踊", 0, 0);
  pop();
  }
  textAlign(LEFT);
  textSize(100);
  text("ど", 50, 50);
  text("る", 120, 50);
  textAlign(CENTER);
  textSize(100);
  text("SIGNAL", 99, 150);
  
  push();
  textAlign(LEFT);
  textSize(40);
  text("2026/02/22 (日)", -50, 220);
  textSize(10);
  text("BLUE", -50, 300);
  text("YELLOW", -50, 330);
  text("RED", -50, 360);
  text("VJ", -50, 400);
  pop();
  
  push();
  textAlign(RIGHT);
  textSize(20);
  text("HTK", 250, 300);
  text("Carrot", 250, 330);
  text("Wagyu & JOJI", 250, 360);
  textSize(10);
  text("Yamagishi Kanata", 250, 400);
  pop();
}