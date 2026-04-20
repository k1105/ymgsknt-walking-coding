let img;
let original;

function preload() {
  img = loadImage("photo.jpg");
}

function setup() {
  let s = min(windowWidth / img.width, windowHeight / img.height);
  createCanvas(img.width * s, img.height * s);
  img.resize(img.width * s, img.height * s);
  original = img.get();
}

function draw() {
  original.loadPixels();
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let bright =
      (original.pixels[i] + original.pixels[i + 1] + original.pixels[i + 2]) /
      3;
    let t = bright / 255;

    let r, g, b;
    const rand = 0.5 * max(noise(frameCount / 100), 0.1);
    if (t < rand) {
      r = 0;
      g = 0;
      b = floor((t / rand) * 255);
    } else if (t < 0.5) {
      r = 0;
      g = floor((t / 0.5) * 255);
      b = 0;
    } else if (t < 1 - rand) {
      r = floor((t / (1 - rand)) * 255);
      g = 0;
      b = 0;
    }

    img.pixels[i] = r;
    img.pixels[i + 1] = g;
    img.pixels[i + 2] = b;
  }
  img.updatePixels();

  image(img, 0, 0);
}
