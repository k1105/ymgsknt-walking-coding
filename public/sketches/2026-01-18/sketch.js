let odolSvg; 

function preload(){
	odolSvg = loadImage("odol_logo.svg");

}

function setup() {
  createCanvas(400, 600);
}

function draw() {
  const currentImage = odolSvg;
  background(255, 1);
  imageMode(CENTER);
  translate(width/2, height/2);
  currentImage.resize(width*(sin(millis()/1000)+1.2)/2,0);
  image(currentImage, 0, 0);
}