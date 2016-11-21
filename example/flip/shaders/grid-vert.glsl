
uniform sampler2D u_grid;
uniform vec3 u_direction;
uniform ivec3 u_count;
uniform vec3 u_offset;

attribute float id;

void main() {
  gl_PointSize = 3.0;
}