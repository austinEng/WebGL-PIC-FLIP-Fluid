
attribute float v_id;
uniform int u_texLength2;
varying float id;

void main() {
  int t = int(v_id) / u_texLength2;
  int s = int(v_id) - t * u_texLength2;
  vec2 st = (vec2(s, t) + 0.01) / float(u_texLength2);
  id = v_id;

  gl_Position = vec4(st, -1.0, 1.0);
  gl_PointSize = 1.0;
}