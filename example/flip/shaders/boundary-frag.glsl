
precision highp float;

uniform sampler2D u_grid;
uniform sampler2D u_types;
uniform int u_texLength;
uniform ivec3 u_count;

varying vec2 f_uv;

float typeAt(int x, int y, int z) {
    int flatIdx = x + y * u_count.x + z * u_count.x * u_count.y;

    int gV = flatIdx / u_texLength;
    int gU = flatIdx - gV * u_texLength;

    vec2 gUV = (vec2(gU, gV) + 0.01) / float(u_texLength);
    
    vec4 val = texture2D(u_types, gUV);
    return val[0];
}

void main() {
    ivec2 pIdx = ivec2(float(u_texLength) * f_uv);
    int idx = pIdx.x + pIdx.y * u_texLength;

    int z = idx / (u_count.x * u_count.y);
    int y = (idx - z * (u_count.x * u_count.y)) / u_count.x;
    int x = idx - y * u_count.x - z * (u_count.x * u_count.y);

    vec4 current = texture2D(u_grid, f_uv);
    
    if (x == 0 || typeAt(x-1, y, z) >= 2.0) {
      current[0] = max(current[0], 0.0);
    }
    if (x == u_count[0] - 1 || typeAt(x+1, y, z) >= 2.0) {
      current[0] = min(current[0], 0.0);
    }
    if (y == 0 || typeAt(x, y-1, z) >= 2.0) {
      current[1] = max(current[1], 0.0);
    }
    if (y == u_count[1] - 1 || typeAt(x, y+1, z) >= 2.0) {
      current[1] = min(current[1], 0.0);
    }
    if (z == 0 || typeAt(x, y, z-1) >= 2.0) {
      current[2] = max(current[2], 0.0);
    }
    if (z == u_count[2] - 1 || typeAt(x, y, z+1) >= 2.0) {
      current[2] = min(current[2], 0.0);
    }

    gl_FragColor = current;
}