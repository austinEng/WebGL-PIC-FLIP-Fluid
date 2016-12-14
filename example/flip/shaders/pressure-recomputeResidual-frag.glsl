
precision highp float;

uniform sampler2D u_A;
uniform sampler2D u_types;
uniform sampler2D u_pcg;
uniform sampler2D u_div;
uniform ivec3 u_count;
uniform int u_texLength;
uniform float u_scale;

varying vec2 f_uv;

@import ./include/grid;

#define GET(grid, uv, c) (texture2D(grid, uv)[c])
#define Aplusi(uv) GET(u_A, uv, 0)
#define Aplusj(uv) GET(u_A, uv, 1)
#define Aplusk(uv) GET(u_A, uv, 2)
#define Adiag(uv) GET(u_A, uv, 3)

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);
  if (!checkIdx(idx, u_count - 1)) discard;
  vec4 curr = texture2D(u_pcg, f_uv);

  ivec3 mIi = idx - ivec3(1,0,0);
  ivec3 mJi = idx - ivec3(0,1,0);
  ivec3 mKi = idx - ivec3(0,0,1);
  ivec3 pIi = idx + ivec3(1,0,0);
  ivec3 pJi = idx + ivec3(0,1,0);
  ivec3 pKi = idx + ivec3(0,0,1);

  vec2 mI = XYZtoUV(mIi, u_texLength, u_count);
  vec2 mJ = XYZtoUV(mJi, u_texLength, u_count);
  vec2 mK = XYZtoUV(mKi, u_texLength, u_count);
  vec2 pI = XYZtoUV(pIi, u_texLength, u_count);
  vec2 pJ = XYZtoUV(pJi, u_texLength, u_count);
  vec2 pK = XYZtoUV(pKi, u_texLength, u_count);

  float val = 0.0;
  if (checkIdx(mIi, u_count - 1)) {
    val += Aplusi(mI) * GET(u_pcg, mI, 0);
  }
  if (checkIdx(mJi, u_count - 1)) {
    val += Aplusj(mJ) * GET(u_pcg, mJ, 0);
  }
  if (checkIdx(mKi, u_count - 1)) {
    val += Aplusk(mK) * GET(u_pcg, mK, 0);
  }
  val += Adiag(f_uv) * GET(u_pcg, f_uv, 0);
  if (checkIdx(pIi, u_count - 1)) {
    val += Aplusi(f_uv) * GET(u_pcg, pI, 0);
  }
  if (checkIdx(pJi, u_count - 1)) {
    val += Aplusj(f_uv) * GET(u_pcg, pJ, 0);
  }
  if (checkIdx(pKi, u_count - 1)) {
    val += Aplusk(f_uv) * GET(u_pcg, pK, 0);
  }

  curr[1] = GET(u_div, f_uv, 1) - u_scale * val;
  gl_FragColor = curr;
}