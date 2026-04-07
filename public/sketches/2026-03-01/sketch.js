const trailPaths = [];
const VERTEX_NUM = 3;
const PATH_NUM = 5;

function setup() {
  createCanvas(500, 700);
  background(255);
  for(let i=0; i<PATH_NUM; i++) {
    const path = [];
    //generate circuit path
    const points = [];
    for(let p=0; p<VERTEX_NUM; p++) {
      points.push([random(-200, width+200),random(-200, height+200)]);
    }

    const handles = [];
    for(let h=0; h<VERTEX_NUM; h++) {
      const theta = random(0, PI);
      const r = random(60, 100);
      handles.push([r*cos(theta), r*sin(theta), -r*cos(theta), -r*sin(theta)]);
    }
    
    for(let p_i=0; p_i<VERTEX_NUM; p_i++) {
      const x = points[p_i][0];
      const y = points[p_i][1];
      const h_x = x + handles[p_i][0];
      const h_y = y + handles[p_i][1];
      const n_x = points[(p_i+1)%VERTEX_NUM][0];
      const n_y = points[(p_i+1)%VERTEX_NUM][1];
      const n_h_x = n_x + handles[(p_i+1)%VERTEX_NUM][2];
      const n_h_y = n_y + handles[(p_i+1)%VERTEX_NUM][3];
      path.push([x, y, h_x, h_y, n_h_x, n_h_y, n_x, n_y]);
    }
    
    trailPaths.push(path);
  }
  
  noFill();
  stroke(0,100,255);
  strokeWeight(500);
  strokeJoin(ROUND);
  strokeCap(PROJECT);
}

function draw() {
  background(255);
  blendMode(HARD_LIGHT);
  const startT = d3.easePolyInOut(frameCount/100 % 1);
  const range = 0.5;
  const detailness = 50;
  let k=0;
  
  for(const closePath of trailPaths) {
    k++;
    beginShape();
      for(let i=0; i<detailness; i++) {
        const p = getPointOnClosePath(closePath, startT+range/detailness*i);
        vertex(p.x, p.y);
      }
    endShape();

  }
  
  
  // for(const close_path of trailPaths) {
  //   drawFullClosePath(close_path);
  // }
}

function getPointOnClosePath (close_path, t) {
  t = t % 1;
  const scaledT = t*VERTEX_NUM;
  const index = floor(scaledT);
  const targetPath = close_path[index];
  const localT = scaledT - index;
  const x = bezierPoint(targetPath[0], targetPath[2], targetPath[4], targetPath[6], localT);
  const y = bezierPoint(targetPath[1], targetPath[3], targetPath[5], targetPath[7], localT);
  return {x: x, y: y};
}

function drawFullClosePath (close_path) {
  for(const p of close_path) {
     beginShape();
    vertex(p[0], p[1]);
    bezierVertex(p[2], p[3], p[4], p[5], p[6], p[7]);
    endShape();  
  }
}