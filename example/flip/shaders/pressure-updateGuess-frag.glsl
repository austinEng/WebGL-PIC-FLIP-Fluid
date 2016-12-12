
precision highp float;

uniform sampler2D u_pcg;
uniform sampler2D u_const;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  vec4 curr = texture2D(u_pcg, f_uv);

  float sigma = texture2D(u_const, vec2(0,0))[0];
  float zdots = texture2D(u_const, vec2(1,0))[0];
  float alpha = sigma / zdots;

  // if (texture2D(u_const, vec2(1,0))[0] == 0.0) {
  //   alpha = 0.0;
  // }

  // if (abs(sigma) < 0.0001) {
  //   alpha = 0.0;
  // }

  curr[0] += alpha*curr[3];
  curr[1] -= alpha*curr[2];

  gl_FragColor = curr;
}