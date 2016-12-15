
attribute float v_id;
uniform ivec3 u_count;
uniform int u_texLength;
uniform sampler2D u_pcg;
varying vec4 val;
varying float keep;
uniform bool u_preconditioned;

@import ./include/grid;

void main() {
  gl_PointSize = 1.0;

  int id = int(v_id);

  ivec3 idx = toXYZ(id, u_count);

  vec4 texVal = texture2D(u_pcg, XYZtoUV(idx, u_texLength, u_count));

  keep = 1.0;

  if (u_preconditioned) {
    texVal[0] = texVal[1] * texVal[2];
  } else {
    texVal[0] = texVal[1] * texVal[1];
  }
  
  val = texVal;

  if (!checkIdx(idx, u_count-1)) val = vec4(0);

  gl_Position = vec4(0,0,0,1);
}