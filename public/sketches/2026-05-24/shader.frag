precision mediump float;
uniform vec2 u_resolution;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

void main() {
  vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;
  float d = sdCircle(p, 0.3);
  vec3 col = (d < 0.0) ? vec3(1.0) : vec3(0.0);
  gl_FragColor = vec4(col, 1.0);
}