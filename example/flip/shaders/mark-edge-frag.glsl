
precision highp float;

uniform sampler2D u_grid;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

void main() {
    ivec2 pIdx = ivec2(float(u_texLength) * f_uv);
    int idx = pIdx.x + pIdx.y * u_texLength;

    int z = idx / (u_count.x * u_count.y);
    int y = (idx - z * (u_count.x * u_count.y)) / u_count.x;
    int x = idx - y * u_count.x - z * (u_count.x * u_count.y);

    if (x == 0 || y == 0 || z == 0 || x == u_count[0]-1 || y == u_count[1]-1 || z == u_count[2]-1) {
      gl_FragColor = vec4(2.0, 2.0, 2.0, 2.0);
    } else {
      discard;
    }
}