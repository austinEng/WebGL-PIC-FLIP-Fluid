
attribute float v_id;
uniform ivec3 u_count;
uniform int u_texLength;
uniform sampler2D u_A;
uniform sampler2D u_pcg;
varying vec4 val;
varying float keep;

@import ./include/grid;

void main() {
  gl_PointSize = 1.0;
  keep = 1.0;

  int id = int(v_id);

  ivec3 idx = toXYZ(id / 4, u_count);
  vec2 uv = XYZtoUV(idx, u_texLength, u_count);

  float s = texture2D(u_pcg, uv)[3];

  int t = id - (id / 4) * 4;

  ivec3 tgtIdx;
  float v;
  if (t == 0) {
    tgtIdx = idx + ivec3(1,0,0);
    v = texture2D(u_A, uv)[0] * s;
  } if (t == 1) {
    tgtIdx = idx + ivec3(0,1,0);
    v = texture2D(u_A, uv)[1] * s;
  } if (t == 2) {
    tgtIdx = idx + ivec3(0,0,1);
    v = texture2D(u_A, uv)[2] * s;
  } if (t == 3) {
    tgtIdx = idx;
    v = texture2D(u_A, uv)[3] * s;
  }

  val = texture2D(u_pcg, XYZtoUV(tgtIdx, u_texLength, u_count)) / 4.0;
  val[2] = v;

  if(!checkIdx(tgtIdx, u_count - 1) || !checkIdx(idx, u_count - 1)) {
    val = vec4(0,0,0,0);
  }

  gl_Position = vec4(XYZtoUV(tgtIdx, u_texLength, u_count) * 2.0 - 1.0, 0.0, 1.0);
}