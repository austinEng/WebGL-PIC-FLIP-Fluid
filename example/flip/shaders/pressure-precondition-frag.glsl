
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
#define Aplusi(grid, uv) GET(grid, uv, 0)
#define Aplusj(grid, uv) GET(grid, uv, 1)
#define Aplusk(grid, uv) GET(grid, uv, 2)
#define Adiag(grid, uv) GET(grid, uv, 3)

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

    float diag = Adiag(u_A, f_uv);
    float e = diag
                  - pow(Aplusi(u_A, mI) * GET(u_Pre, mI, 0), 2.0)
                  - pow(Aplusj(u_A, mJ) * GET(u_Pre, mJ, 0), 2.0)
                  - pow(Aplusk(u_A, mK) * GET(u_Pre, mK, 0), 2.0)

                  - 0.97 * (
                    Aplusi(u_A, mI) * (
                      Aplusj(u_A, mI) + Aplusk(u_A, mI)
                    ) * pow(GET(u_Pre, mI, 0), 2.0) +

                    Aplusj(u_A, mJ) * (
                      Aplusi(u_A, mJ) + Aplusk(u_A, mJ)
                    ) * pow(GET(u_Pre, mJ, 0), 2.0) +

                    Aplusk(u_A, mK) * (
                      Aplusi(u_A, mK) + Aplusj(u_A, mK)
                    ) * pow(GET(u_Pre, mK, 0), 2.0)
                  );
  if (e < 0.25 * diag) {
    e = diag;
  }
  e = 1.0 / sqrt(e);
  gl_FragColor = vec4(e, e, e, 1.0);
}