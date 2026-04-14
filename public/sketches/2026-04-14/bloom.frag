precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex;
uniform vec2 resolution;

void main() {
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;
    vec4 col = texture2D(tex, uv);

    vec4 bloom = vec4(0.0);
    float count = 0.0;
    for(float x = -4.0; x <= 4.0; x += 1.0) {
        for(float y = -4.0; y <= 4.0; y += 1.0) {
            vec2 dir = normalize(uv - 0.5);
            vec2 offset = dir * x * 5.0 / resolution;
            vec4 s = texture2D(tex, uv+offset);
            float bright = max(s.r, max(s.g, s.b));
            bloom += s * smoothstep(0.8, 1.0, bright);
            count += 1.0;
        }
    }

    bloom /= count;
    gl_FragColor = col - bloom * 5.0;
}