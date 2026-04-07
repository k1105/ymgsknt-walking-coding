let theShader;

const vert = `
  precision highp float;
  attribute vec3 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 1.0);
  }
`;

const frag = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_zoom;
  uniform float u_seed;

  vec3 getRainbow(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
  }

  vec2 fold(vec2 p, float n) {
    float r = length(p);
    float a = atan(p.y, p.x) - 1.5708;
    float tau = 6.28318;
    a = mod(a, tau / n) - tau / (n * 2.0);
    a = abs(a);
    return vec2(cos(a), sin(a)) * r;
  }

  void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    float numMirrors = 3.0 + mod(u_seed, 6.0);
    p = fold(p, numMirrors);
    p *= u_zoom;

    float t = u_time * 0.05;
    vec3 color = vec3(0.0);
    vec2 shift = vec2(0.8 + sin(u_seed * 1.5) * 0.1, 0.8 + cos(u_seed * 0.7) * 0.1);

    for(int i = 0; i < 7; i++) {
        p = abs(p) / dot(p, p) - (shift + sin(t * 2.0 + u_seed) * 0.05);

        float dust = smoothstep(0.3, 0.0, length(fract(p * 2.0) - 0.5));

        float colorShift = t + float(i) * 0.1 + length(p) * 0.2 + u_seed * 0.1;
        vec3 dustColor = getRainbow(colorShift);

        float intensity = pow(float(i + 1), 1.5);
        color += dustColor * dust * 0.2* intensity;

        float line = 0.1 / abs(p.x + p.y + sin(t * 10.0 + float(i) + u_seed));
       color += getRainbow(colorShift + 0.5) * line * 0.5;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  theShader = createShader(vert, frag);
}

function draw() {
  shader(theShader);

  let absoluteTime = millis() / 1000.0;
  let cycleDuration = 78.5;
  let t = absoluteTime % cycleDuration;

  let loopSeed = floor(absoluteTime / cycleDuration);

  let zoomPulse = sin(t * 0.1);
  let currentZoom = map(zoomPulse, 1, -1, 0.1, 3.0);

  theShader.setUniform("u_resolution", [width, height]);
  theShader.setUniform("u_time", t);
  theShader.setUniform("u_zoom", currentZoom);
  theShader.setUniform("u_seed", float(loopSeed));

  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
