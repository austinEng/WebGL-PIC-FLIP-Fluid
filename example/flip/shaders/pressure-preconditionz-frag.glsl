
precision highp float;

@import ./include/grid;

uniform ivec3 u_count;
uniform sampler2D u_A;
uniform sampler2D u_pre;
uniform sampler2D u_pcg;
uniform int u_texLength;

uniform int u_step;
uniform int u_iter;

varying vec2 f_uv;

varying vec4 val;

void main() {
  ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

  vec2 mI = XYZtoUV(idx - ivec3(1,0,0), u_texLength, u_count);
  vec2 mJ = XYZtoUV(idx - ivec3(0,1,0), u_texLength, u_count);
  vec2 mK = XYZtoUV(idx - ivec3(0,0,1), u_texLength, u_count);

  if (u_step == 0) {

    vec4 curr = texture2D(u_pcg, f_uv);
    if (idx.x <= u_iter && idx.y <= u_iter && idx.z <= u_iter) {
      float t = texture2D(u_pcg, f_uv)[1]
        - texture2D(u_A, mI)[0] * texture2D(u_pre, mI)[0] * texture2D(u_pcg, mI)[2]
        - texture2D(u_A, mJ)[1] * texture2D(u_pre, mJ)[0] * texture2D(u_pcg, mJ)[2]
        - texture2D(u_A, mK)[2] * texture2D(u_pre, mK)[0] * texture2D(u_pcg, mK)[2];
      curr[2] = t * texture2D(u_pre, f_uv)[0];
    }
    gl_FragColor = curr;

  } else if (u_step == 1) {

    vec4 curr = texture2D(u_pcg, f_uv);
    if (idx.x >= u_iter && idx.y >= u_iter && idx.z >= u_iter) {
      float t = texture2D(u_pcg, f_uv)[2]
        - texture2D(u_A, f_uv)[0] * texture2D(u_pre, f_uv)[0] * texture2D(u_pcg, mI)[2]
        - texture2D(u_A, f_uv)[1] * texture2D(u_pre, f_uv)[0] * texture2D(u_pcg, mJ)[2]
        - texture2D(u_A, f_uv)[2] * texture2D(u_pre, f_uv)[0] * texture2D(u_pcg, mK)[2];
      curr[2] = t * texture2D(u_pre, f_uv)[0];
    }
    gl_FragColor = curr;

  }
}