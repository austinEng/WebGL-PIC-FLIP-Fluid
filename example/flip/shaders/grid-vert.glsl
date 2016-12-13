
uniform sampler2D u_grid;
uniform vec3 u_direction;
uniform vec3 u_min;
uniform ivec3 u_count;
uniform float u_cellSize;
uniform mat4 u_viewProj;
uniform int u_texLength;
uniform int u_g;

attribute float v_id;

varying vec3 f_col;

@import ./include/grid;

void main() {

  int idx = int(v_id / 2.0);

  vec3 pos;

  float scale = 0.2;
  if (u_g == 0) {
    ivec3 xyz = toXYZ(idx, u_count);
    pos = positionOf(xyz, u_min, u_cellSize) + vec3(0,0.5,0.5) * u_cellSize;

    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += scale * vec3(1,0,0) * gridComponentAt(u_grid, xyz, u_count, u_texLength, 0);
    }
  } else if (u_g == 1) {
    ivec3 xyz = toXYZ(idx, u_count);
    pos = positionOf(xyz, u_min, u_cellSize) + vec3(0.5,0,0.5) * u_cellSize;

    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += scale * vec3(0,1,0) * gridComponentAt(u_grid, xyz, u_count, u_texLength, 1);
    }
  } else if (u_g == 2) {
    ivec3 xyz = toXYZ(idx, u_count);
    pos = positionOf(xyz, u_min, u_cellSize) + vec3(0.5,0.5,0) * u_cellSize;

    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += scale * vec3(0,0,1) * gridComponentAt(u_grid, xyz, u_count, u_texLength, 2);
    }
  }

  f_col = u_direction;

  vec4 p = u_viewProj * vec4(pos, 1.0);
  p /= p[3];
  gl_Position = p;

  gl_PointSize = 1.0;
}