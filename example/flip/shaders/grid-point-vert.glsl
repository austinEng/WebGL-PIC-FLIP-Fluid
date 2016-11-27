
uniform sampler2D u_grid;
uniform ivec3 u_count;
// uniform vec3 u_offset;
uniform vec3 u_min;
uniform vec3 u_max;
uniform float u_cellSize;
uniform mat4 u_viewProj;
uniform int u_texLength;

attribute float v_id;

varying vec4 f_col;

@import ./include/grid;

void main() {

  vec3 offset = vec3(0.5,0.5,0.5) * u_cellSize;

  ivec3 count = gridCount(offset, u_max, u_min, u_cellSize);
  ivec3 idx = toXYZ(int(v_id), count);

  vec3 pos = u_min + offset + vec3(idx) * u_cellSize;

  vec4 val = gridAt(u_grid, idx, count, u_texLength);

  float v2 = val.r - 4.0 * floor(val.r / 4.0);
  float v1 = v2 - 2.0 * floor(v2 / 2.0);

  f_col = vec4(
    v1 >= 1.0,
    v2 >= 2.0,
    val.r >= 4.0,
    0.5);

  gl_Position = u_viewProj * vec4(pos, 1.0);

  gl_PointSize = 3.0;
}