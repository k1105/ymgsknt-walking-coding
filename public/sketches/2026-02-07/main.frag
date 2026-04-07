precision highp float;

float PI=3.14159265358979;
float TAU=6.283185306;

varying vec2 vTexCoord;

uniform float u_time;
uniform sampler2D u_tex;

float random(vec2 st){
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*1000.1278);
}

void main(void){
  vec2 p=vTexCoord;
  
  p.y += sin(p.x*TAU*3.0) * .1;
  
  vec4 col=texture2D(u_tex,p);
  
  float g = (col.r + col.g + col.b) / 3.0;
  bool mono = (col.r == col.g && col.g == col.b);
  
  col = (mono && g > 0.1 && random(p) < 0.2)  ? vec4(vec3(random(p)), 0.1) : col; 
  
  gl_FragColor=col;
}