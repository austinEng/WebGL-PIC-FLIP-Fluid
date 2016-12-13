
precision highp float;

uniform sampler2D u_pcg;
uniform sampler2D u_const;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  vec4 curr = texture2D(u_pcg, f_uv);

  float sigmanew = texture2D(u_const, vec2(0,1))[0];
  float sigma = texture2D(u_const, vec2(0,0))[0];
  float beta = sigmanew / sigma;

  if (((sigma <= 0.0 || 0.0 <= sigma) ? false : true)) beta = 0.0;

  curr[3] = curr[2] + beta*curr[3];

  // if (abs(sigma) == 0.00001 || abs(sigmanew) == 0.00001) {
  //   curr[3] = 0.0;
  // }

  gl_FragColor = curr;
}