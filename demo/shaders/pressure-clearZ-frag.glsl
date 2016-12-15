
precision highp float;

uniform sampler2D u_pcg;

varying vec2 f_uv;

void main() {
  vec4 val = texture2D(u_pcg, f_uv);
  val[2] = 0.0;
  gl_FragColor = val;
}