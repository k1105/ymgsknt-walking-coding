let tex;
let postShader;
let font;

function preload(){
  postShader = loadShader("main.vert", "main.frag");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  tex = createGraphics(width, height, WEBGL);
}

function draw() {
  tex.background(0);
  tex.push();
  tex.rotateZ(frameCount/100);
  tex.rotateX(frameCount/200);
  for(let i=0; i<10; i++) {
    tex.push();
    tex.translate(100*(i-5),0,0);
    tex.box(50*i);
    tex.pop();

  }
  tex.pop();
  
  shader(postShader);
  
  postShader.setUniform("u_time", frameCount * 0.01);
  postShader.setUniform("u_tex", tex);
  
　rect(-width/2, -height/2, width, height);
}