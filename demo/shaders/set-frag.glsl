
precision highp float;

varying vec4 val;
varying float keep;

void main() {
  if (keep != 1.0) discard;
  gl_FragColor = val;
}