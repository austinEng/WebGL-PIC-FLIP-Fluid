
precision highp float;

uniform sampler2D u_pcg;
uniform sampler2D u_const;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  vec4 curr = texture2D(u_pcg, f_uv);

  float alpha = texture2D(u_const, vec2(0,0))[0] / texture2D(u_const, vec2(1,0))[0];

  if (texture2D(u_const, vec2(1,0))[0] == 0.0) {
    alpha = 0.0;
  }

  curr[0] += alpha*curr[3];
  curr[1] -= alpha*curr[2];

  gl_FragColor = curr;
}