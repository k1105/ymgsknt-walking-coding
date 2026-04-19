let img;

function preload() {
  img = loadImage("photo.jpg");
}

function setup() {
  createCanvas(img.width, img.height);
}

function draw() {
  img.loadPixels();
  const rangeW = (img.height * (sin(millis() / 1000 - PI / 2) + 1)) / 2;
  for (
    let y = floor((img.height - rangeW) / 2);
    y <= floor((img.height + rangeW) / 2);
    y++
  ) {
    let row = [];
    for (let x = 0; x < img.width; x++) {
      let i = (y * img.width + x) * 4;
      row.push([img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]]);
    }

    row.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    for (let x = 0; x < img.width; x++) {
      let i = (y * img.width + x) * 4;
      img.pixels[i] = row[x][0];
      img.pixels[i + 1] = row[x][1];
      img.pixels[i + 2] = row[x][2];
    }
  }

  img.updatePixels();
  image(img, 0, 0);
}
