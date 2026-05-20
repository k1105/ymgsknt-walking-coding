precision mediump float;
varying vec2 vTexCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = vTexCoord;
  uv.x *= u_resolution.x / u_resolution.y;
  
  float d = distance(uv, vec2(0.5 * u_resolution.x / u_resolution.y, 0.5));
  float pulse = sin(u_time * 2.0) * 0.1 + 0.3;
  float circle = smoothstep(pulse + 0.02, pulse, d);
  
  vec3 colorA = vec3(0.1, 0.2, 0.5);
  vec3 colorB = vec3(1.0, 0.4, 0.2);
  vec3 bg = mix(colorA, colorB, uv.y);
  
  vec3 col = mix(bg, vec3(1.0), circle);
  gl_FragColor = vec4(col, 1.0);
}