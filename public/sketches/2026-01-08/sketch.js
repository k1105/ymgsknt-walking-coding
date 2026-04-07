class Snake {
  constructor(pos=[0,0]) {
    this.pos = pos;
    this.r = 0;
    this.theta = 0;
    this.seed = random();
    this.isDead = false;
    this.count = 0;
  }
  
  update() {
    if(this.isDead) return;
    
    this.r = 0.7*noise(frameCount/1000 + 100*this.seed);
    this.theta = 100*noise(frameCount/1000 + 200*this.seed);
    this.pos[0] += this.r * cos(this.theta);
    this.pos[1] += this.r * sin(this.theta);
    this.count++;
    if(this.count > 300 || abs(this.pos[0]) > width/2 || abs(this.pos[1]) > height / 2) this.isDead = true;
  }
}

let snakes = [];

function setup() {
  createCanvas(400,600);
  noFill();
  stroke(255);
  background(0);
  for(let i=0; i<20; i++) {
    const snake = new Snake();
    snakes.push(snake);
  }
}

function draw() {
  background(0);
  translate(width/2, height/2);
  const newSnakes = [];
  //update snakes
  
  for(const snake of snakes) {
    snake.update();
    if(frameCount % 100 == 0 && !snake.isDead && floor(random()*2) == 0) {
      const newSnake = new Snake([...snake.pos]);
      newSnakes.push(newSnake);
    }
  }
  
  snakes = [...snakes, ...newSnakes].filter(elem => !elem.isDead);
  if(snakes.length > 1000) snakes = snakes.slice(0, 1000);
  
  for(let i=0; i<snakes.length-1; i++) {
    const beginNode = [...snakes[i].pos];
    const endNode = [...snakes[i+1].pos];
    line(beginNode[0], beginNode[1], endNode[0], endNode[1]);
  }
}