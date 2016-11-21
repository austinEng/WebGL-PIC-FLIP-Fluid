
precision mediump float;

uniform sampler2D gU_old;
uniform float u_t;

varying vec2 f_uv;

void main() {
    vec4 col = texture2D(gU_old, f_uv);
    col.g -= 9.81 * u_t / 1000.0;
    gl_FragColor = vec4(col.rgb, 1.0);
}