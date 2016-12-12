
precision highp float;

@import ./include/grid;

uniform ivec3 u_count;
uniform sampler2D u_A;
uniform sampler2D u_pre;
uniform sampler2D u_types;
uniform sampler2D u_pcg;
uniform int u_texLength;

uniform int u_step;
uniform int u_iter;
uniform bool u_setS;

varying vec2 f_uv;

varying vec4 val;

#define GET(grid, uv, c) (uv.x < 0.0 ? 0.0 : texture2D(grid, uv)[c])
#define Aplusi(grid, uv) GET(grid, uv, 0)
#define Aplusj(grid, uv) GET(grid, uv, 1)
#define Aplusk(grid, uv) GET(grid, uv, 2)
#define Adiag(grid, uv) GET(grid, uv, 3)
#define precon(grid, uv) GET(grid, uv, 0)

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

  if (texture2D(u_types, f_uv)[0] != 1.0) discard;

  vec2 mI = XYZtoUV(idx - ivec3(1,0,0), u_texLength, u_count);
  vec2 mJ = XYZtoUV(idx - ivec3(0,1,0), u_texLength, u_count);
  vec2 mK = XYZtoUV(idx - ivec3(0,0,1), u_texLength, u_count);
  vec2 pI = XYZtoUV(idx + ivec3(1,0,0), u_texLength, u_count);
  vec2 pJ = XYZtoUV(idx + ivec3(0,1,0), u_texLength, u_count);
  vec2 pK = XYZtoUV(idx + ivec3(0,0,1), u_texLength, u_count);

  if (!checkIdx(idx - ivec3(1,0,0), u_count)) mI[0] = -1.0;
  if (!checkIdx(idx - ivec3(0,1,0), u_count)) mJ[0] = -1.0;
  if (!checkIdx(idx - ivec3(0,0,1), u_count)) mK[0] = -1.0; 
  if (!checkIdx(idx + ivec3(1,0,0), u_count)) pI[0] = -1.0;
  if (!checkIdx(idx + ivec3(0,1,0), u_count)) pJ[0] = -1.0;
  if (!checkIdx(idx + ivec3(0,0,1), u_count)) pK[0] = -1.0; 

  int greatestIdx = int(max(max(float(idx.x), float(idx.y)), float(idx.z)));
  int smallestIdx = int(min(min(float(idx.x), float(idx.y)), float(idx.z)));

  vec4 curr = texture2D(u_pcg, f_uv);
  if (u_step == 0) {

    
    // if (u_iter == greatestIdx) {
    if (u_iter >= idx.x && u_iter >= idx.y && u_iter >= idx.z) {
      float t = texture2D(u_pcg, f_uv)[1]
        - Aplusi(u_A, mI) * precon(u_pre, mI) * GET(u_pcg, mI, 2)
        - Aplusj(u_A, mJ) * precon(u_pre, mJ) * GET(u_pcg, mJ, 2)
        - Aplusk(u_A, mK) * precon(u_pre, mK) * GET(u_pcg, mK, 2);
      curr[2] = t * precon(u_pre, f_uv);
    }

  } else if (u_step == 1) {

    // if (u_iter == smallestIdx) {
    if (u_iter <= idx.x && u_iter <= idx.y && u_iter <= idx.z) {
      float t = texture2D(u_pcg, f_uv)[2]
        - Aplusi(u_A, f_uv) * precon(u_pre, f_uv) * GET(u_pcg, pI, 2)
        - Aplusj(u_A, f_uv) * precon(u_pre, f_uv) * GET(u_pcg, pJ, 2)
        - Aplusk(u_A, f_uv) * precon(u_pre, f_uv) * GET(u_pcg, pK, 2);
      curr[2] = t * precon(u_pre, f_uv);
      if (u_setS) curr[3] = curr[2];
    }
  }

  gl_FragColor = curr;
}