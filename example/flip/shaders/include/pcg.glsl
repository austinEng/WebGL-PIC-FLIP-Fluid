
float ADIAG(ivec3 idx, ivec3 count, int texLength, sampler2D types) {
  if (!checkIdx(idx, count - 1)) return 0.0;
  vec2 uv = XYZtoUV(idx, texLength, count);

  ivec3 mIi = idx - ivec3(1,0,0);
  ivec3 mJi = idx - ivec3(0,1,0);
  ivec3 mKi = idx - ivec3(0,0,1);
  ivec3 pIi = idx + ivec3(1,0,0);
  ivec3 pJi = idx + ivec3(0,1,0);
  ivec3 pKi = idx + ivec3(0,0,1);

  vec2 mI = XYZtoUV(mIi, texLength, count);
  vec2 mJ = XYZtoUV(mJi, texLength, count);
  vec2 mK = XYZtoUV(mKi, texLength, count);
  vec2 pI = XYZtoUV(pIi, texLength, count);
  vec2 pJ = XYZtoUV(pJi, texLength, count);
  vec2 pK = XYZtoUV(pKi, texLength, count);


  float diag = 6.0;

  if (texture2D(types, uv)[0] != 1.0) {
    return diag;
    // return 0.0;
  }

  if (checkIdx(mIi, count - 1) && texture2D(types, mI)[0] == 2.0) diag--;
  if (checkIdx(mJi, count - 1) && texture2D(types, mJ)[0] == 2.0) diag--;
  if (checkIdx(mKi, count - 1) && texture2D(types, mK)[0] == 2.0) diag--;
  if (checkIdx(pIi, count - 1) && texture2D(types, pI)[0] == 2.0) diag--;
  if (checkIdx(pJi, count - 1) && texture2D(types, pJ)[0] == 2.0) diag--;
  if (checkIdx(pKi, count - 1) && texture2D(types, pK)[0] == 2.0) diag--;

  return diag;
}

float AMAT(ivec3 idx1, ivec3 idx2, ivec3 count, int texLength, sampler2D types) {
  vec2 uv1 = XYZtoUV(idx1, texLength, count);
  vec2 uv2 = XYZtoUV(idx2, texLength, count);

  if (!checkIdx(idx1, count - 1) || texture2D(types, uv1)[0] != 1.0) return 0.0;
  if (!checkIdx(idx2, count - 1) || texture2D(types, uv2)[0] != 1.0) return 0.0;

  return -1.0;
}