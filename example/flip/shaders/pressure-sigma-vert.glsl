
attribute float v_id;
uniform ivec3 u_count;
uniform int u_textureLength;
uniform sampler2D u_pcg;
varying vec4 val;
varying float keep;

@import ./include/grid;

void main() {
  gl_PointSize = 10.0;

  int id = int(v_id);

  ivec3 idx = toXYZ(id, u_count);

  vec4 texVal = texture2D(u_pcg, XYZtoUV(idx, u_textureLength, u_count) * 2.0 - 1.0);

  keep = 1.0;
  // val = vec4(vec3(texVal[1]), 1);
  // val = vec4(2);
  texVal[0] = texVal[1] * texVal[2];
  val = texVal;

  gl_Position = vec4(0,0,0,1);
}