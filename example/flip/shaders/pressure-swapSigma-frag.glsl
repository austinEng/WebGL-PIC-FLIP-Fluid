precision highp float;

uniform sampler2D u_const;
varying vec2 f_uv;

void main() {
  gl_FragColor = texture2D(u_const, vec2(f_uv.x, 1.0 - f_uv.y));
}