let img;
let threshold = 200;

function preload() {
  img = loadImage("/assets/photo.jpg");
}

function setup() {
  let s = min(windowWidth / img.width, windowHeight / img.height);
  createCanvas(img.width * s, img.height * s);
  img.resize(img.width * s, img.height * s);
}

function draw() {
  img.loadPixels();

  for (let x = 0; x < img.width; x++) {
    let angle = (noise(x * 0.01) - 0.1) * PI;
    let pixels = [];
    let positions = [];
    const lineWidth = 15;

    for (let s = 0; s < lineWidth; s++) {
      for (let t = 0; t < img.height; t++) {
        let px = floor(x + sin(angle) * t + s);
        let py = t;
        positions.push({x: px, y: py});
        if (px < 0 || px >= img.width) continue;
        let i = (py * img.width + px) * 4;
        pixels.push({
          x: px,
          y: py,
          rgb: [img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]],
        });
      }
    }

    pixels.sort(
      (a, b) =>
        a.rgb[0] + a.rgb[1] + a.rgb[2] - (b.rgb[0] + b.rgb[1] + b.rgb[2]),
    );

    for (let k = 0; k < pixels.length; k++) {
      let si = (positions[k].y * img.width + positions[k].x) * 4;
      img.pixels[si] = pixels[k].rgb[0];
      img.pixels[si + 1] = pixels[k].rgb[1];
      img.pixels[si + 2] = pixels[k].rgb[2];
    }
  }

  img.updatePixels();
  image(img, 0, 0);

  noLoop();
}
