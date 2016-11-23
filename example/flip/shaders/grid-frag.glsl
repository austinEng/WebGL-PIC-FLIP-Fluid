
precision mediump float;

varying vec3 f_col;

void main() {
  gl_FragColor = vec4(f_col, 1.0);
}