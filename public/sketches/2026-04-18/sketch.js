let img;
let threshold = 250;

function preload() {
  img = loadImage("photo.png");
}

function setup() {
  let s = min(windowWidth / img.width, windowHeight / img.height);
  createCanvas(img.width * s, img.height * s);
  img.resize(img.width * s, img.height * s);
}

function draw() {
  img.loadPixels();
  let start = -1;
  for (let x = 0; x < img.width; x++) {
    start = -1;
    for (let y = 0; y < img.height; y++) {
      let i = (y * img.width + x) * 4;
      let bright = (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;

      if (bright > threshold && start === -1) {
        start = y;
      } else if (
        (bright <= threshold || y === img.height - 1) &&
        start !== -1
      ) {
        let section = [];
        for (let sy = start; sy < y; sy++) {
          let si = (sy * img.width + x) * 4;
          section.push([
            img.pixels[si],
            img.pixels[si + 1],
            img.pixels[si + 2],
          ]);
        }
        section.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
        for (let k = 0; k < section.length; k++) {
          let si = ((start + k) * img.width + x) * 4;
          img.pixels[si] = section[k][0];
          img.pixels[si + 1] = section[k][1];
          img.pixels[si + 2] = section[k][2];
        }
      }
    }
  }

  img.updatePixels();
  image(img, 0, 0);
}
