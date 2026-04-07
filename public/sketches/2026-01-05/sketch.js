let cp = [0,0,0];
let np = [1,0,0];
const spheres = [];

function setup() {
  createCanvas(500, 700, WEBGL);
  noStroke();
  for(let i=0; i<100; i++) {
    const ce_sphere = new CubeEdgeSphere(0, cp, np);
    spheres.push(ce_sphere);    
  }
}

function draw() {
  background(0);
    rotateX(frameCount / 1000);
  rotateZ(frameCount / 1000);
  
  for(const sphr of spheres) {
    push();
    sphr.updateState();
    sphr.moveOnCubeEdge();
    sphere(5);
    pop();
  }
}

class CubeEdgeSphere {
  constructor(t, cp, np) {
    this.cubeSize = 150;
    this.cp =[...cp];
    this.np = [...np];
    this.t = t;
    this.speed = 0.003;
  }
  
  updateState() {
    this.t += this.speed;
    if(this.t < 1) return;
    
    this.cp = [...this.np];
    const randVal = floor(3*random());
    this.np[randVal] = (this.np[randVal] + 1) % 2;
    this.speed = floor(random()*2+1) * 0.0005;
    this.t = 0;
  }
  
  moveOnCubeEdge() {
    translate(2*this.cubeSize * (this.cp[0]*(1-this.t) + this.np[0]*this.t - 0.5), this.cubeSize * (this.cp[1]*(1-this.t) + this.np[1]*this.t - 0.5), this.cubeSize * (this.cp[2]*(1-this.t) + this.np[2]*this.t - 0.5));
  }
}