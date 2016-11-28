
precision highp float;

uniform sampler2D gU_old;
uniform float u_t;

varying vec2 f_uv;

void main() {
    vec4 col = texture2D(gU_old, f_uv);
    if (col.w > 0.0) {
        col /= col.w;
    }
    gl_FragColor = col;
}