
precision highp float;

uniform ivec3 u_count;
uniform sampler2D u_types;
uniform sampler2D u_A;
uniform int u_texLength;
uniform float u_scale;
varying vec4 val;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  // keep = 1.0;

  // int id = int(v_id);

  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);
  // ivec3 idx = toXYZ(id / 6, u_count);
  
  if (!(gridAt(u_types, idx, u_count, u_texLength)[0] == 1.0 || gridAt(u_types, idx, u_count, u_texLength)[0] == 3.0)) {
    discard;
  }

  if (!checkIdx(idx, u_count - 1)) discard;

  // if (idx.x >= u_count.x - 1 || 
  //     idx.y >= u_count.y - 1 || 
  //     idx.z >= u_count.z - 1) {
  //       discard;
  //     }

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

  float mIt = texture2D(u_types, mI)[0];
  float mJt = texture2D(u_types, mJ)[0];
  float mKt = texture2D(u_types, mK)[0];
  float pIt = texture2D(u_types, pI)[0];
  float pJt = texture2D(u_types, pJ)[0];
  float pKt = texture2D(u_types, pK)[0];

  float div = -u_scale * (
    texture2D(u_A, pI)[0] - texture2D(u_A, f_uv)[0] +
    texture2D(u_A, pJ)[1] - texture2D(u_A, f_uv)[1] +
    texture2D(u_A, pK)[2] - texture2D(u_A, f_uv)[2]
  );

  if (idx.x == 0 || (checkIdx(mIi, u_count - 1) && mIt == 2.0)) {
    div -= u_scale * texture2D(u_A, f_uv)[0];
  }
  if (idx.x == u_count.x - 2 || (checkIdx(pIi, u_count - 1) && pIt == 2.0)) {
    div += u_scale * texture2D(u_A, pI)[0];
  }
  if (idx.y == 0 || (checkIdx(mJi, u_count - 1) && mJt == 2.0)) {
    div -= u_scale * texture2D(u_A, f_uv)[1];
  }
  if (idx.y == u_count.y - 2 || (checkIdx(pJi, u_count - 1) && pJt == 2.0)) {
    div += u_scale * texture2D(u_A, pJ)[1];
  }
  if (idx.z == 0 || (checkIdx(mKi, u_count - 1) && mKt == 2.0)) {
    div -= u_scale * texture2D(u_A, f_uv)[2];
  }
  if (idx.z == u_count.z - 2 || (checkIdx(pKi, u_count - 1) && pKt == 2.0)) {
    div += u_scale * texture2D(u_A, pK)[2];
  }

                  //  p   r   z  s <-- initial search dir is residual
  gl_FragColor = vec4(0, div, 0, div);
  
  // if (idx.x >= u_count.x - 1 || 
  //     idx.y >= u_count.y - 1 || 
  //     idx.z >= u_count.z - 1) {
  //       keep = 0.0;
  //       return;
  //     }

  // int offsetID = id - (id / 6) * 6;

  // ivec3 offset;
  // if (offsetID == 0) {
  //   offset = ivec3(-1,0,0);
  // } else if (offsetID == 1) {
  //   offset = ivec3(1,0,0);
  // } else if (offsetID == 2) {
  //   offset = ivec3(0,-1,0);
  // } else if (offsetID == 3) {
  //   offset = ivec3(0,1,0);
  // } else if (offsetID == 4) {
  //   offset = ivec3(0,0,-1);
  // } else if (offsetID == 5) {
  //   offset = ivec3(0,0,1);
  // }

  // if (gridAt(u_types, idx + offset, u_count, u_texLength)[0] == 2.0) {

  // }
}