
precision highp float;

varying vec3 val;

void main() {
    gl_FragColor = vec4(val, 1.0);
}