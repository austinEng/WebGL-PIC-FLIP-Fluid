
precision highp float;

uniform sampler2D u_grid;
uniform sampler2D u_types;
uniform sampler2D u_pcg;

uniform float u_scale;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

#define CHECK_FLUID(offset) (checkIdx(idx + offset, u_count - 1) && (texture2D(u_types, XYZtoUV(idx + offset, u_texLength, u_count))[0] == 1.0 || texture2D(u_types, XYZtoUV(idx + offset, u_texLength, u_count))[0] == 3.0))

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

  vec4 current = texture2D(u_grid, f_uv);

  // if (!checkIdx(idx, u_count - 1)) {
  //   gl_FragColor = current; 
  //   return;
  // }

  bool leftFluid = CHECK_FLUID(ivec3(-1,0,0));
  bool rightFluid = CHECK_FLUID(ivec3(0,0,0));
  bool downFluid = CHECK_FLUID(ivec3(0,-1,0));
  bool upFluid = CHECK_FLUID(ivec3(0,0,0));
  bool backFluid = CHECK_FLUID(ivec3(0,0,-1));
  bool frontFluid = CHECK_FLUID(ivec3(0,0,0));

  if (leftFluid || rightFluid) {
    current[0] -= u_scale * (
      texture2D(u_pcg, XYZtoUV(idx, u_texLength, u_count))[0] -
      texture2D(u_pcg, XYZtoUV(idx - ivec3(1,0,0), u_texLength, u_count))[0]
    );
  }

  if (downFluid || upFluid) {
    current[1] -= u_scale * (
      texture2D(u_pcg, XYZtoUV(idx, u_texLength, u_count))[0] -
      texture2D(u_pcg, XYZtoUV(idx - ivec3(0,1,0), u_texLength, u_count))[0]
    );
  }

  if (backFluid || frontFluid) {
    current[2] -= u_scale * (
      texture2D(u_pcg, XYZtoUV(idx, u_texLength, u_count))[0] -
      texture2D(u_pcg, XYZtoUV(idx - ivec3(0,0,1), u_texLength, u_count))[0]
    );
  }

  gl_FragColor = current;
}