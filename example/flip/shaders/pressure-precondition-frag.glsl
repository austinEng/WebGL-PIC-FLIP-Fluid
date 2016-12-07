
precision highp float;

uniform sampler2D u_A;
uniform sampler2D u_Pre;
uniform sampler2D u_types;
uniform int u_texLength;
uniform int u_iter;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

#define GET(grid, uv, c) (uv.x < 0.0 ? 0.0 : texture2D(grid, uv)[c])

void main() {
    if (texture2D(u_types, f_uv)[0] != 1.0) discard;
    ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);
    if (idx.x > u_iter || idx.y > u_iter || idx.z > u_iter) discard;

    vec2 mI = XYZtoUV(idx - ivec3(1,0,0), u_texLength, u_count);
    vec2 mJ = XYZtoUV(idx - ivec3(0,1,0), u_texLength, u_count);
    vec2 mK = XYZtoUV(idx - ivec3(0,0,1), u_texLength, u_count);
    if (!checkIdx(idx - ivec3(1,0,0), u_count)) mI[0] = -1.0;
    if (!checkIdx(idx - ivec3(0,1,0), u_count)) mJ[0] = -1.0;
    if (!checkIdx(idx - ivec3(0,0,1), u_count)) mK[0] = -1.0; 

    float diag = GET(u_A, f_uv, 3);
    float e = diag
                  - pow(GET(u_A, mI, 0) * GET(u_Pre, mI, 0), 2.0)
                  - pow(GET(u_A, mJ, 0) * GET(u_Pre, mJ, 0), 2.0)
                  - pow(GET(u_A, mK, 0) * GET(u_Pre, mK, 0), 2.0)

                  - 0.97 * (
                    GET(u_A, mI, 0) * (
                      GET(u_A, mI, 1) + GET(u_A, mI, 2)
                    ) * pow(GET(u_Pre, mI, 0), 2.0) +

                    GET(u_A, mJ, 1) * (
                      GET(u_A, mJ, 0) + GET(u_A, mJ, 2)
                    ) * pow(GET(u_Pre, mJ, 0), 2.0) +

                    GET(u_A, mK, 2) * (
                      GET(u_A, mK, 0) + GET(u_A, mK, 1)
                    ) * pow(GET(u_Pre, mK, 0), 2.0)
                  );
  if (e < 0.25 * diag) {
    e = diag;
  }
  e = 1.0 / sqrt(e);
  gl_FragColor = vec4(e, e, e, 1.0);
}