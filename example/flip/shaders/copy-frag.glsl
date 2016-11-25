
precision highp float;

uniform sampler2D u_grid;

varying vec2 f_uv;

void main() {
    gl_FragColor = texture2D(u_grid, f_uv);
}