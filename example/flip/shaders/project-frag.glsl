
precision highp float;

varying vec4 vel;
varying float keep;

void main() {
    if (keep == 0.0) discard;
    gl_FragColor = vel;
}