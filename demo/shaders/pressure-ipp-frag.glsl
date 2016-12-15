
precision highp float;

uniform sampler2D u_pcg;
uniform sampler2D u_A;
uniform sampler2D u_types;
uniform int u_step;
uniform int u_texLength;
uniform ivec3 u_count;
uniform bool u_setS;

varying vec2 f_uv;

@import ./include/grid;

#define GET(grid, uv, c) (texture2D(grid, uv)[c])
#define Aplusi(uv) GET(u_A, uv, 0)
#define Aplusj(uv) GET(u_A, uv, 1)
#define Aplusk(uv) GET(u_A, uv, 2)
#define Adiag(uv) GET(u_A, uv, 3)

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

  vec4 curr = texture2D(u_pcg, f_uv);

  if (!checkIdx(idx, u_count - 1)) {
    gl_FragColor = curr;
    return;
  }

  ivec3 pIi = idx + ivec3(1,0,0);
  ivec3 pJi = idx + ivec3(0,1,0);
  ivec3 pKi = idx + ivec3(0,0,1);

  vec2 pI = XYZtoUV(pIi, u_texLength, u_count);
  vec2 pJ = XYZtoUV(pJi, u_texLength, u_count);
  vec2 pK = XYZtoUV(pKi, u_texLength, u_count);

  if (u_step == 0) {
    if (checkIdx(pIi, u_count - 1)) {
      curr[2] = curr[1] - 1.0 / Adiag(pI) * Aplusi(f_uv) * GET(u_pcg, pI, 1);
    }
    if (checkIdx(pJi, u_count - 1)) {
      curr[2] = curr[1] - 1.0 / Adiag(pJ) * Aplusj(f_uv) * GET(u_pcg, pJ, 1);
    }
    if (checkIdx(pKi, u_count - 1)) {
      curr[2] = curr[1] - 1.0 / Adiag(pK) * Aplusk(f_uv) * GET(u_pcg, pK, 1);
    }
  } else if (u_step == 1) {
    float invdiag = 1.0 / Adiag(f_uv);
    if (checkIdx(pIi, u_count - 1)) {
      curr[2] -= invdiag * Aplusi(f_uv) * GET(u_pcg, pI, 2);
    }
    if (checkIdx(pJi, u_count - 1)) {
      curr[2] -= invdiag * Aplusj(f_uv) * GET(u_pcg, pJ, 2);
    }
    if (checkIdx(pKi, u_count - 1)) {
      curr[2] -= invdiag * Aplusk(f_uv) * GET(u_pcg, pK, 2);
    }
    if (u_setS) curr[3] = curr[2];
  }

  gl_FragColor = curr;
}