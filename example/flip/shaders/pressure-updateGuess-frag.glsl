
precision highp float;

uniform sampler2D u_pcg;
uniform sampler2D u_const;
uniform int u_texLength;
uniform ivec3 u_count;
uniform float u_alpha;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  vec4 curr = texture2D(u_pcg, f_uv);

  float sigma = texture2D(u_const, vec2(0,0))[0];
  float zdots = texture2D(u_const, vec2(1,0))[0];
  float alpha = sigma / zdots;

  if (((zdots <= 0.0 || 0.0 <= zdots) ? false : true)) alpha = 0.0;

  curr[0] += alpha*curr[3];
  curr[1] -= alpha*curr[2];

  // curr[0] += u_alpha*curr[3];
  // curr[1] -= u_alpha*curr[2];

  gl_FragColor = curr;
}