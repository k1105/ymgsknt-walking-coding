let nodes = [{name: "0", width: 25, height: 25, x: 0, y: 0, displayX: 0, displayY: 0}];
let links = [];
let d3cola;
let isReady = false;
let currentScale = 1;

function setup() {
  createCanvas(450, 700);
  background(240);
  textAlign(CENTER, CENTER);
  if(typeof cola !== 'undefined') {
    d3cola = cola.d3adaptor(d3)
      .size([width, height])
      .avoidOverlaps(true)
      .handleDisconnected(true);
    
    updateNetwork();
    isReady = true;
  }
}

function updateNetwork() {
  d3cola
    .nodes(nodes)
    .links(links)
    .jaccardLinkLengths(30, 0.7)
    .start(1, 1, 1);
}

function draw() {
  background(0);
  
  if (!isReady) return;
  
  if(nodes.length < 100 && frameCount % 1 === 0) {
    let targetIdx = floor(random(0, nodes.length));
    let parent = nodes[targetIdx];
    let newNode = {
      name: nodes.length.toString(),
      width: 25, height: 25,
      x: parent.x, y: parent.y,
      displayX: parent.displayX, displayY: parent.displayY
    };
    
    nodes.push(newNode);
    links.push({source: targetIdx, target: nodes.length - 1});
    updateNetwork();
  }
  
  nodes.forEach(n => {
    n.displayX = lerp(n.displayX, n.x, 0.15);
    n.displayY = lerp(n.displayY, n.y, 0.15);
  })
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  nodes.forEach(n=>{
    minX = min(minX, n.displayX); maxX = max(maxX, n.displayX);
    minY = min(minY, n.displayY); maxY = max(maxY, n.displayY);
  })
  
  let graphW = maxX - minX + 100;
  let graphH = maxY - minY + 100;
  
  let targetScale = min(width / graphW, height / graphH, 1.0);
  currentScale = lerp(currentScale, targetScale, 0.05);
  
  push();
  translate(width/2, height/2);
  fill(255, 0,0);
  const txt = "YamagishiKanata";
  scale(currentScale);
  translate(-(minX + maxX) / 2, -(minY + maxY) / 2);
  
  stroke(100, 150, 255);
  strokeWeight(50 / currentScale);
  blendMode(SCREEN);
  links.forEach(d => {
    line(d.source.displayX, d.source.displayY, d.target.displayX,
        d.target.displayY);
  });
  
  let num = 0;
  textSize(20);
  
  noStroke();
  // nodes.forEach(n=>{
  //   fill(100, 180, 255);
  //   text(txt[num % txt.length], n.displayX, n.displayY);
  //   num++;
  // });
  
  pop();
}