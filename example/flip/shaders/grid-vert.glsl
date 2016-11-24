
uniform sampler2D u_grid;
uniform vec3 u_direction;
uniform ivec3 u_count;
uniform vec3 u_offset;
uniform vec3 u_min;
uniform float u_cellSize;
uniform mat4 u_viewProj;
uniform int u_texLength;
uniform int u_g;

attribute float v_id;

varying vec3 f_col;

void main() {

  int idx = int(v_id / 2.0);

  int vidx = idx / u_texLength;
  int uidx = idx - vidx * u_texLength;

  vec2 uv = (vec2(uidx, vidx) + 0.01) / float(u_texLength);

  int z = idx / (u_count.x * u_count.y);
  int y = (idx - z * (u_count.x * u_count.y)) / u_count.x;
  int x = idx - y * u_count.x - z * (u_count.x * u_count.y);

  vec3 pos = u_min + u_offset + vec3(x, y, z) * u_cellSize;

  if (u_g == 0) {
    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += vec3(1,0,0) * texture2D(u_grid, uv)[0];
    }
  } else if (u_g == 1) {
    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += vec3(0,1,0) * texture2D(u_grid, uv)[1];
    }
  } else if (u_g == 2) {
    if (v_id / 2.0 > floor(v_id / 2.0)) {
      pos += vec3(0,0,1) * texture2D(u_grid, uv)[2];
    }
  }

  f_col = u_direction;

  gl_Position = u_viewProj * vec4(pos, 1.0);

  gl_PointSize = 1.0;
}