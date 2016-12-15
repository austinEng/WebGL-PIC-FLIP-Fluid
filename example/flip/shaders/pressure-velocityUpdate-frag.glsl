
precision highp float;

uniform sampler2D u_grid;
uniform sampler2D u_types;
uniform sampler2D u_pcg;

uniform float u_scale;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

#define CELL_TYPE(offset) (checkIdx(idx + offset, u_count - 1) ? int(texture2D(u_types, XYZtoUV(idx + offset, u_texLength, u_count))[0]) : -1)

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

  vec4 current = texture2D(u_grid, f_uv);

  // if (!checkIdx(idx, u_count - 1)) {
  //   gl_FragColor = current; 
  //   return;
  // }

  int leftType = CELL_TYPE(ivec3(-1,0,0));
  int rightType = CELL_TYPE(ivec3(0,0,0));
  int downType = CELL_TYPE(ivec3(0,-1,0));
  int upType = CELL_TYPE(ivec3(0,0,0));
  int backType = CELL_TYPE(ivec3(0,0,-1));
  int frontType = CELL_TYPE(ivec3(0,0,0));

  if (leftType == 1 || rightType == 1) {
    current[0] -= u_scale * (
      texture2D(u_pcg, XYZtoUV(idx, u_texLength, u_count))[0] -
      texture2D(u_pcg, XYZtoUV(idx - ivec3(1,0,0), u_texLength, u_count))[0]
    );
  }

  if (downType == 1 || upType == 1) {
    current[1] -= u_scale * (
      texture2D(u_pcg, XYZtoUV(idx, u_texLength, u_count))[0] -
      texture2D(u_pcg, XYZtoUV(idx - ivec3(0,1,0), u_texLength, u_count))[0]
    );
  }

  if (backType == 1 || frontType == 1) {
    current[2] -= u_scale * (
      texture2D(u_pcg, XYZtoUV(idx, u_texLength, u_count))[0] -
      texture2D(u_pcg, XYZtoUV(idx - ivec3(0,0,1), u_texLength, u_count))[0]
    );
  }

  // if (leftType == 2 || rightType == 2) {
  //   current[0] = 0.0;
  // }

  // if (downType == 2 || upType == 2) {
  //   current[1] = 0.0;
  // }

  // if (backType == 2 || frontType == 2) {
  //   current[2] = 0.0;
  // }

  gl_FragColor = current;
}