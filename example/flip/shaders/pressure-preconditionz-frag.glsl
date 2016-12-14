
precision highp float;

@import ./include/grid;
@import ./include/pcg;

uniform ivec3 u_count;
uniform sampler2D u_A;
uniform sampler2D u_pre;
uniform sampler2D u_types;
uniform sampler2D u_pcg;
uniform sampler2D u_q;
uniform int u_texLength;

uniform int u_step;
uniform int u_iter;
uniform bool u_setS;

varying vec2 f_uv;

varying vec4 val;

#define GET(grid, uv, c) (uv.x < 0.0 ? 0.0 : texture2D(grid, uv)[c])
#define Aplusi(uv) GET(u_A, uv, 0)
#define Aplusj(uv) GET(u_A, uv, 1)
#define Aplusk(uv) GET(u_A, uv, 2)
#define Adiag(uv) GET(u_A, uv, 3)
#define precon(uv) GET(u_pre, uv, 0)

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);
  vec4 curr;
  if (u_step == 0) {
    curr = texture2D(u_q, f_uv);
  } else if (u_step == 1) {
    curr = texture2D(u_pcg, f_uv);
  }
  if (!checkIdx(idx, u_count - 1) || !(texture2D(u_types, f_uv)[0] == 1.0 || texture2D(u_types, f_uv)[0] == 3.0)) {
    gl_FragColor = curr;
    return;
  }

  vec2 mI = XYZtoUV(idx - ivec3(1,0,0), u_texLength, u_count);
  vec2 mJ = XYZtoUV(idx - ivec3(0,1,0), u_texLength, u_count);
  vec2 mK = XYZtoUV(idx - ivec3(0,0,1), u_texLength, u_count);
  vec2 pI = XYZtoUV(idx + ivec3(1,0,0), u_texLength, u_count);
  vec2 pJ = XYZtoUV(idx + ivec3(0,1,0), u_texLength, u_count);
  vec2 pK = XYZtoUV(idx + ivec3(0,0,1), u_texLength, u_count);

  if (!checkIdx(idx - ivec3(1,0,0), u_count-1)) mI[0] = -1.0;
  if (!checkIdx(idx - ivec3(0,1,0), u_count-1)) mJ[0] = -1.0;
  if (!checkIdx(idx - ivec3(0,0,1), u_count-1)) mK[0] = -1.0; 
  if (!checkIdx(idx + ivec3(1,0,0), u_count-1)) pI[0] = -1.0;
  if (!checkIdx(idx + ivec3(0,1,0), u_count-1)) pJ[0] = -1.0;
  if (!checkIdx(idx + ivec3(0,0,1), u_count-1)) pK[0] = -1.0; 

  // int greatestIdx = int(max(max(float(idx.x), float(idx.y)), float(idx.z)));
  // int smallestIdx = int(min(min(float(idx.x), float(idx.y)), float(idx.z)));

  // vec4 curr;
  if (u_step == 0) {
    // curr = texture2D(u_q, f_uv);
    // if (u_iter == greatestIdx) {
    if (idx.x <= u_iter && idx.y <= u_iter && idx.z <= u_iter) {
      float t = texture2D(u_pcg, f_uv)[1]
        - Aplusi(mI) * precon(mI) * GET(u_q, mI, 0)
        - Aplusj(mJ) * precon(mJ) * GET(u_q, mJ, 0)
        - Aplusk(mK) * precon(mK) * GET(u_q, mK, 0);
        // - AMAT(idx, idx - ivec3(1,0,0), u_count, u_texLength, u_types) * precon(mI) * GET(u_q, mI, 0)
        // - AMAT(idx, idx - ivec3(0,1,0), u_count, u_texLength, u_types) * precon(mJ) * GET(u_q, mJ, 0)
        // - AMAT(idx, idx - ivec3(0,0,1), u_count, u_texLength, u_types) * precon(mK) * GET(u_q, mK, 0);
      curr[0] = t * precon(f_uv);
    }

  } else if (u_step == 1) {
    // curr = texture2D(u_pcg, f_uv);
    // if (u_iter == smallestIdx) {
    if (idx.x >= u_iter && idx.y >= u_iter && idx.z >= u_iter) {
      float t = texture2D(u_q, f_uv)[0]
        - Aplusi(f_uv) * precon(f_uv) * GET(u_pcg, pI, 2)
        - Aplusj(f_uv) * precon(f_uv) * GET(u_pcg, pJ, 2)
        - Aplusk(f_uv) * precon(f_uv) * GET(u_pcg, pK, 2);
        // - AMAT(idx, idx + ivec3(1,0,0), u_count, u_texLength, u_types) * precon(f_uv) * GET(u_pcg, pI, 2)
        // - AMAT(idx, idx + ivec3(0,1,0), u_count, u_texLength, u_types) * precon(f_uv) * GET(u_pcg, pJ, 2)
        // - AMAT(idx, idx + ivec3(0,0,1), u_count, u_texLength, u_types) * precon(f_uv) * GET(u_pcg, pK, 2);
      curr[2] = t * precon(f_uv);
      if (u_setS) curr[3] = curr[2];
      // curr = vec4(float(idx.x), float(idx.y), float(idx.z), curr[2]);
    }
  }

  gl_FragColor = curr;
}