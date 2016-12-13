
attribute float v_id;
uniform ivec3 u_count;
uniform int u_texLength;
uniform sampler2D u_A;
uniform sampler2D u_pcg;
varying vec4 val;
varying float keep;

@import ./include/grid;

#define GET(grid, uv, c) (texture2D(grid, uv)[c])
#define Aplusi(uv) GET(u_A, uv, 0)
#define Aplusj(uv) GET(u_A, uv, 1)
#define Aplusk(uv) GET(u_A, uv, 2)
#define Adiag(uv) GET(u_A, uv, 3)

void main() {
  gl_PointSize = 1.0;
  keep = 1.0;

  int id = int(v_id);

  ivec3 idx = toXYZ(id / 7, u_count);
  vec2 uv = XYZtoUV(idx, u_texLength, u_count);

  float s = texture2D(u_pcg, uv)[3];

  int t = id - (id / 7) * 7;

  // gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  
  // take the current item at index i in s and

  // idx is the s index

  ivec3 tgtIdx;
  if (t == 0) {
    tgtIdx = idx + ivec3(1,0,0);
  } else if (t == 1) {
    tgtIdx = idx + ivec3(0,1,0);
  } else if (t == 2) {
    tgtIdx = idx + ivec3(0,0,1);
  } else if (t == 3) {
    tgtIdx = idx;
  } else if (t == 4) {
    tgtIdx = idx - ivec3(1,0,0);
  } else if (t == 5) {
    tgtIdx = idx - ivec3(0,1,0);
  } else if (t == 6) {
    tgtIdx = idx - ivec3(0,0,1);
  }

  vec2 tgt = XYZtoUV(tgtIdx, u_texLength, u_count);
  vec2 mI = XYZtoUV(tgtIdx - ivec3(1,0,0), u_texLength, u_count);
  vec2 mJ = XYZtoUV(tgtIdx - ivec3(0,1,0), u_texLength, u_count);
  vec2 mK = XYZtoUV(tgtIdx - ivec3(0,0,1), u_texLength, u_count);
  // vec2 pI = XYZtoUV(tgtIdx + ivec3(1,0,0), u_texLength, u_count);
  // vec2 pJ = XYZtoUV(tgtIdx + ivec3(0,1,0), u_texLength, u_count);
  // vec2 pK = XYZtoUV(tgtIdx + ivec3(0,0,1), u_texLength, u_count);

  float v;
  if (t == 0) {
    v = Aplusi(tgt) * s;
    // if (!checkIdx(tgtIdx, u_count - 1)) keep = 0.0;
  } else if (t == 1) {
    v = Aplusj(tgt) * s;
    // if (!checkIdx(tgtIdx, u_count - 1)) keep = 0.0;
  } else if (t == 2) {
    v = Aplusk(tgt) * s;
    // if (!checkIdx(tgtIdx, u_count - 1)) keep = 0.0;
  } else if (t == 3) {
    v = Adiag(tgt) * s;
    // if (!checkIdx(tgtIdx, u_count - 1)) keep = 0.0;
  } else if (t == 4) {
    v = Aplusi(mI) * s;
    if (!checkIdx(tgtIdx - ivec3(1,0,0), u_count - 1)) keep = 0.0;
  } else if (t == 5) {
    v = Aplusj(mJ) * s;
    if (!checkIdx(tgtIdx - ivec3(0,1,0), u_count - 1)) keep = 0.0;
  } else if (t == 6) {
    v = Aplusk(mK) * s;
    if (!checkIdx(tgtIdx - ivec3(0,0,1), u_count - 1)) keep = 0.0;
  }

  val = texture2D(u_pcg, tgt) / 7.0;

  if (!checkIdx(tgtIdx, u_count - 1) || keep == 0.0) {
    keep = 1.0;
  } else {
    val[2] = v;
  }

  gl_Position = vec4(tgt * 2.0 - 1.0, 0.0, 1.0);
  
  // ivec3 tgtIdx;
  // float v;
  // if (t == 0) {
  //   tgtIdx = idx + ivec3(1,0,0);
  //   v = texture2D(u_A, uv)[0] * s;
  // } else if (t == 1) {
  //   tgtIdx = idx + ivec3(0,1,0);
  //   v = texture2D(u_A, uv)[1] * s;
  // } else if (t == 2) {
  //   tgtIdx = idx + ivec3(0,0,1);
  //   v = texture2D(u_A, uv)[2] * s;
  // } else if (t == 3) {
  //   tgtIdx = idx;
  //   v = texture2D(u_A, uv)[3] * s;
  // } else if (t == 4) {
  //   tgtIdx = idx;
  //   v = texture2D(u_A, XYZtoUV(idx - ivec3(1,0,0), u_texLength, u_count))[0] * s;
  //   if (!checkIdx(idx - ivec3(1,0,0), u_count - 1)) v = 0.0;
  // } else if (t == 5) {
  //   tgtIdx = idx;
  //   v = texture2D(u_A, XYZtoUV(idx - ivec3(0,1,0), u_texLength, u_count))[1] * s;
  //   if (!checkIdx(idx - ivec3(0,1,0), u_count - 1)) v = 0.0;
  // } else if (t == 6) {
  //   tgtIdx = idx;
  //   v = texture2D(u_A, XYZtoUV(idx - ivec3(0,0,1), u_texLength, u_count))[2] * s;
  //   if (!checkIdx(idx - ivec3(0,0,1), u_count - 1)) v = 0.0;
  // }

  // val = texture2D(u_pcg, XYZtoUV(tgtIdx, u_texLength, u_count)) / 4.0;
  // val[2] = v;

  // if(!checkIdx(tgtIdx, u_count - 1) || !checkIdx(idx, u_count - 1)) {
  //   val[2] = 0.0;
  // }

  // gl_Position = vec4(XYZtoUV(tgtIdx, u_texLength, u_count) * 2.0 - 1.0, 0.0, 1.0);
}