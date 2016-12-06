
precision highp float;

uniform ivec3 u_count;
uniform sampler2D u_types;
uniform sampler2D u_A;
uniform int u_texLength;
uniform float u_scale;
varying vec4 val;

varying vec2 f_uv;

@import ./include/grid;

void main() {
  // keep = 1.0;

  // int id = int(v_id);

  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);
  // ivec3 idx = toXYZ(id / 6, u_count);
  
  if (gridAt(u_types, idx, u_count, u_texLength)[0] != 1.0) {
    discard;
  }

  vec2 pI = XYZtoUV(idx + ivec3(1,0,0), u_texLength, u_count);
  vec2 pJ = XYZtoUV(idx + ivec3(0,1,0), u_texLength, u_count);
  vec2 pK = XYZtoUV(idx + ivec3(0,0,1), u_texLength, u_count);

  float div = -u_scale * (
    texture2D(u_A, pI)[0] - texture2D(u_A, f_uv)[0] +
    texture2D(u_A, pJ)[1] - texture2D(u_A, f_uv)[1] +
    texture2D(u_A, pK)[2] - texture2D(u_A, f_uv)[2]
  );

  gl_FragColor = vec4(div, div, div, 1.0);
  
  // if (idx.x >= u_count.x - 1 || 
  //     idx.y >= u_count.y - 1 || 
  //     idx.z >= u_count.z - 1) {
  //       keep = 0.0;
  //       return;
  //     }

  // int offsetID = id - (id / 6) * 6;

  // ivec3 offset;
  // if (offsetID == 0) {
  //   offset = ivec3(-1,0,0);
  // } else if (offsetID == 1) {
  //   offset = ivec3(1,0,0);
  // } else if (offsetID == 2) {
  //   offset = ivec3(0,-1,0);
  // } else if (offsetID == 3) {
  //   offset = ivec3(0,1,0);
  // } else if (offsetID == 4) {
  //   offset = ivec3(0,0,-1);
  // } else if (offsetID == 5) {
  //   offset = ivec3(0,0,1);
  // }

  // if (gridAt(u_types, idx + offset, u_count, u_textureLength)[0] == 2.0) {

  // }
}