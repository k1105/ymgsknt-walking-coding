let particles = [];
const num = 500;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  for (let i = 0; i < num; i++) {
    particles.push(
      createVector(random(-200, 200), random(-200, 200), random(-200, 200)),
    );
  }
}

function draw() {
  background(0);
  orbitControl();

  stroke(255, 50);
  strokeWeight(2);
  for (let p of particles) {
    let scale = 0.005;
    let dx = (noise(p.x * scale, p.y * scale, p.z * scale) - 0.5) * 2;
    let dy =
      (noise(p.x * scale + 100, p.y * scale + 100, p.z * scale + 100) - 0.5) *
      2;
    let dz =
      (noise(p.x * scale + 200, p.y * scale + 200, p.z * scale + 200) - 0.5) *
      2;

    p.x += dx;
    p.y += dy;
    p.z += dz;

    let d = p.mag();
    if (d > 400) {
      p.mult(0.995);
    }

    point(p.x, p.y, p.z);
  }

  // for (let i = 0; i < particles.length; i++) {
  //   for (let j = i + 1; j < particles.length; j++) {
  //     let d = p5.Vector.dist(particles[i], particles[j]);
  //     if (d < 30) {
  //       line(
  //         particles[i].x,
  //         particles[i].y,
  //         particles[i].z,
  //         particles[j].x,
  //         particles[j].y,
  //         particles[j].z,
  //       );
  //     }
  //   }
  // }

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = p5.Vector.dist(particles[i], particles[j]);

      if (d < 80) {
        line(
          particles[i].x,
          particles[i].y,
          particles[i].z,
          particles[j].x,
          particles[j].y,
          particles[j].z,
        );
      }
    }
  }
}
