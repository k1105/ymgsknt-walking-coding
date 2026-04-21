precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex;
uniform float u_time;

vec3 thermalMap(float t, float threshold) {
  if (t < threshold) {
    return vec3(0.0, 0.0, t / threshold);
  } else if (t < 0.5) {
    return vec3(0.0, (t - threshold) / (0.5 - threshold), 0.0);
  } else if (t < 1.0 - threshold) {
    return vec3((t - 0.5) / (0.5 - threshold), 0.0, 0.0);
  } else {
    return vec3(1.0, (t - (1.0 - threshold)) / threshold, 0.0);
  }
}

vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 1.0);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.0, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;
    vec4 col = texture2D(tex, uv);

    float bright = (col.r + col.g + col.b) / 3.0;
    float threshold = 0.5 * max(abs(sin(u_time*5.5))*0.5+0.5, 0.01);

    vec3 thermal = thermalMap(bright, threshold);
    gl_FragColor = vec4(thermal, 1.0);
}