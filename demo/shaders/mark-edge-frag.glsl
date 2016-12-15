
precision highp float;

uniform sampler2D u_grid;
uniform int u_texLength;
uniform ivec3 u_count;
uniform float u_cellSize;

varying vec2 f_uv;

@import ./include/grid;

void main() {
    ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

    if (any(equal(idx, ivec3(0,0,0))) || any(equal(idx, u_count - 2))) {
      gl_FragColor = vec4(2.0, 2.0, 2.0, 2.0);
      discard;
    } else {
      discard;
    }
}