
precision highp float;

uniform ivec3 u_count;
uniform sampler2D u_types;
uniform int u_texLength;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

  float diag = 6.0;

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

  

}