
precision highp float;

uniform sampler2D u_pcg;
uniform sampler2D u_const;
uniform int u_texLength;
uniform ivec3 u_count;
uniform float u_beta;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  vec4 curr = texture2D(u_pcg, f_uv);

  float sigmanew = texture2D(u_const, vec2(0,1))[0];
  float sigma = texture2D(u_const, vec2(0,0))[0];
  float beta = sigmanew / sigma;

  if (((sigma <= 0.0 || 0.0 <= sigma) ? false : true)) beta = 0.0;
  if (sigma == 0.0) beta = 0.0;

  curr[3] = curr[2] + beta*curr[3];
  // curr[3] = curr[2] + u_beta*curr[3];

  gl_FragColor = curr;
}