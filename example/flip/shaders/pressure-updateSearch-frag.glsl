
precision highp float;

uniform sampler2D u_pcg;
uniform sampler2D u_const;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  vec4 curr = texture2D(u_pcg, f_uv);

  float beta = texture2D(u_const, vec2(0,1))[0] / texture2D(u_const, vec2(0,0))[0];

  if (texture2D(u_const, vec2(0,0))[0] == 0.0) {
    beta == 0.0;
  }

  curr[3] = curr[2] + beta*curr[3];

  gl_FragColor = curr;
}