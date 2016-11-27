
uniform sampler2D u_grid;
uniform vec3 u_direction;
uniform vec3 u_min;
uniform vec3 u_max;
uniform float u_cellSize;
uniform mat4 u_viewProj;
uniform int u_texLength;
uniform int u_g;

attribute float v_id;

varying vec3 f_col;

@import ./include/grid;

void main() {

  int idx = int(v_id / 2.0);

  int vidx = idx / u_texLength;
  int uidx = idx - vidx * u_texLength;

  vec2 uv = (vec2(uidx, vidx) + 0.01) / float(u_texLength);

  vec3 pos;

  if (u_g == 0) {
    vec3 offset = vec3(0,0.5,0.5) * u_cellSize;
    ivec3 count = gridCount(offset, u_max, u_min, u_cellSize);
    pos = positionOf(toXYZ(idx, count), u_min, offset, u_cellSize);

    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += 1.0 * vec3(1,0,0) * texture2D(u_grid, uv)[0];
    }
  } else if (u_g == 1) {
    vec3 offset = vec3(0.5,0,0.5) * u_cellSize;
    ivec3 count = gridCount(offset, u_max, u_min, u_cellSize);
    pos = positionOf(toXYZ(idx, count), u_min, offset, u_cellSize);

    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += 1.0 * vec3(0,1,0) * texture2D(u_grid, uv)[1];
    }
  } else if (u_g == 2) {
    vec3 offset = vec3(0.5,0.5,0) * u_cellSize;
    ivec3 count = gridCount(offset, u_max, u_min, u_cellSize);
    pos = positionOf(toXYZ(idx, count), u_min, offset, u_cellSize);

    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += 1.0 * vec3(0,0,1) * texture2D(u_grid, uv)[2];
    }
  }

  f_col = u_direction;

  gl_Position = u_viewProj * vec4(pos, 1.0);

  gl_PointSize = 1.0;
}