
precision highp float;

uniform sampler2D u_grid;
uniform int u_texLength;
uniform vec3 u_min;
uniform vec3 u_max;
uniform float u_cellSize;

varying vec2 f_uv;

@import ./include/grid;

void main() {
    ivec3 count = gridCount(vec3(0.5, 0.5, 0.5) * u_cellSize, u_max, u_min, u_cellSize);
    ivec3 idx = UVtoXYZ(f_uv, u_texLength, count);

    if (any(equal(idx, ivec3(0,0,0))) || any(equal(idx, count - 1))) {
      gl_FragColor = vec4(2.0, 2.0, 2.0, 2.0);
    } else {
      discard;
    }
}