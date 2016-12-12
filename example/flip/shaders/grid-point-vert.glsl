
uniform sampler2D u_grid;
uniform ivec3 u_count;
uniform vec3 u_min;
uniform float u_cellSize;
uniform mat4 u_viewProj;
uniform int u_texLength;
uniform int u_mode;
uniform int u_c;

attribute float v_id;

varying vec4 f_col;

@import ./include/grid;

void main() {

  ivec3 idx = toXYZ(int(v_id), u_count);

  vec3 pos = positionOf(idx, u_min, u_cellSize) + vec3(0.5,0.5,0.5) * u_cellSize;

  vec4 val = gridAt(u_grid, idx, u_count, u_texLength);

  if (u_mode == 0) {
    float v2 = val.r - 4.0 * floor(val.r / 4.0);
    float v1 = v2 - 2.0 * floor(v2 / 2.0);

    f_col = vec4(
    max(float(v1 >= 1.0), 0.1),
    max(float(v2 >= 2.0), 0.1),
    max(float(val.r >= 4.0), 0.1),
    0.2);
  } else if (u_mode == 1) {
    f_col = 10.0*vec4(vec3(abs(val)), 0.2);
  } else if (u_mode == 2) {
    for (int i = 0; i < 3; ++i) {
      if (i == u_c) {
        f_col = vec4(vec3(abs(val[i])), 0.2);   
        break;
      }
    }
  }

  vec4 p = u_viewProj * vec4(pos, 1.0);
  p /= p[3];
  gl_Position = p;

  gl_PointSize = 10.0;

  if (!checkIdx(idx, u_count - 1)) {
    gl_PointSize = 0.0;
    gl_Position = vec4(100,100,0.0,1.0);
  }
}