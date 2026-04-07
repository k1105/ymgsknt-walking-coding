class DancingText {
  constructor(txt, dancingFilter=[]) {
    this.txt = txt;
    if(dancingFilter.length !== txt.length) {
      this.dancingFilter = [];
      for(let i=0; i<txt.length; i++) {
        this.dancingFilter.push(Math.random() > 0.5 ? 0 : 1);
      }
    }
  }
  
  danceText() {
    push();
      this.txt.split("").forEach((c, id) => {
      if(this.dancingFilter[id] === 1) {
        for(let j=0; j<5; j++) {
          push();
          const f = millis() + 10*j;
          textSize(15*(sin(f/150+10*noise(id*10))+3));
          text(c, 20*(noise(f/1000+id+100)-0.5), 20*(noise(f/1000+id)-0.5));
          pop();
        }

      } else {
        text(c, 0, 0); 
      }
      translate(textWidth(c)*1,0);
    });
    pop();
  }
}

const txtSize = 30;
const texts = ["あのイーハトーヴォの", "すきとおった風", "夏でも底に冷たさをもつ青いそら", "うつくしい森で飾られたモーリオ市", "郊外のぎらぎらひかる草の波"];
const dancingTexts = [];

function setup() {
  createCanvas(600, 800);
  background(250);
  textSize(txtSize);
  textAlign(CENTER, CENTER);
  textFont("Shippori Antique B1");
  fill(0);
  for(const txt of texts){
    dancingTexts.push(new DancingText(txt));}
}

function draw() {
  background(250, 150);
  translate(70, height/3);
  for(const dT of dancingTexts) {
    dT.danceText();
    translate(0, txtSize * 2);
  }
}