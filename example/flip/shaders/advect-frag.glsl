
precision mediump float;

uniform float u_t;

varying vec3 pos;
varying vec3 vel;

void main() {
    gl_FragColor = vec4(pos + vel * u_t, 1.0);
}