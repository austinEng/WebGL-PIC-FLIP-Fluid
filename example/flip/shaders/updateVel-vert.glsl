
attribute float v_id;
uniform sampler2D u_particles;
uniform sampler2D u_gA;
uniform sampler2D u_gB;

uniform float u_cellSize;
uniform vec3 u_min;
uniform vec3 u_max;
uniform ivec3 u_count;

uniform int u_particleTexLength;
uniform int u_gridTexLength;

uniform bool u_copy;

varying vec3 val;

ivec3 gridCount(vec3 offset) {
    return ivec3(ceil((u_max - u_min - offset) / u_cellSize));
}

float gridAt(sampler2D grid, const int g, ivec3 idx) {
    int flatIdx = idx.x + idx.y * u_count.x + idx.z * u_count.x * u_count.y;

    int gV = flatIdx / u_gridTexLength;
    int gU = flatIdx - gV * u_gridTexLength;

    vec2 gUV = (vec2(gU, gV) + 0.01) / float(u_gridTexLength);
    
    vec4 val = texture2D(grid, gUV);
    if (g == 0) return val[0];
    if (g == 1) return val[1];
    if (g == 2) return val[2];
    return 0.0;
}

vec3 fractionalIndex(sampler2D grid, const int g, vec3 pos, vec3 offset, ivec3 count) {
    return clamp((pos - offset - u_min) / u_cellSize, vec3(0,0,0), vec3(count));
}

float interolateOnGrid(sampler2D grid, const int g, vec3 pos) {
    vec3 offset = vec3(0.5, 0.5, 0.5);
    if (g == 0) offset[0] = 0.0;
    if (g == 1) offset[1] = 0.0;
    if (g == 2) offset[2] = 0.0;
    ivec3 count = gridCount(offset);
    
    vec3 fIdx = fractionalIndex(grid, g, pos, offset, count);

    vec3 l = floor(fIdx);
    vec3 U = clamp(ceil(fIdx), vec3(0,0,0), vec3(count - 1));

    float k1 = l.z == U.z ? gridAt(grid, g, ivec3(l.x, l.y, l.z)) : (U.z - fIdx.z) * gridAt(grid, g, ivec3(l.x, l.y, l.z)) + (fIdx.z - l.z) * gridAt(grid, g, ivec3(l.x, l.y, U.z));
    float k2 = l.z == U.z ? gridAt(grid, g, ivec3(l.x, U.y, l.z)) : (U.z - fIdx.z) * gridAt(grid, g, ivec3(l.x, U.y, l.z)) + (fIdx.z - l.z) * gridAt(grid, g, ivec3(l.x, U.y, U.z));
    float k3 = l.z == U.z ? gridAt(grid, g, ivec3(U.x, l.y, l.z)) : (U.z - fIdx.z) * gridAt(grid, g, ivec3(U.x, l.y, l.z)) + (fIdx.z - l.z) * gridAt(grid, g, ivec3(U.x, l.y, U.z));
    float k4 = l.z == U.z ? gridAt(grid, g, ivec3(U.x, U.y, l.z)) : (U.z - fIdx.z) * gridAt(grid, g, ivec3(U.x, U.y, l.z)) + (fIdx.z - l.z) * gridAt(grid, g, ivec3(U.x, U.y, U.z));

    float j1 = l.y == U.y ? k1 : (U.y - fIdx.y) * k1 + (fIdx.y - l.y) * k2;
    float j2 = l.y == U.y ? k3 : (U.y - fIdx.y) * k3 + (fIdx.y - l.y) * k4;

    return l.x == U.x ? j1 : (U.x - fIdx.x) * j1 + (fIdx.x - l.x) * j2;
}

void main() {
    int pIdx = int(v_id) * 2;
    int vIdx = int(v_id) * 2 + 1;

    int pV = pIdx / u_particleTexLength;
    int pU = pIdx - pV * u_particleTexLength;

    int vV = vIdx / u_particleTexLength;
    int vU = vIdx - vV * u_particleTexLength;

    vec2 pUV = (vec2(pU, pV) + 0.01) / float(u_particleTexLength);
    vec2 vUV = (vec2(vU, vV) + 0.01) / float(u_particleTexLength);

    vec3 pos = texture2D(u_particles, pUV).rgb;
    vec3 vel = texture2D(u_particles, vUV).rgb;

    if (u_copy) {
        val = pos;
        gl_Position = vec4(pUV * 2.0 - 1.0, 0.0, 1.0);
    } else {

        vec3 velA = vec3(
            interolateOnGrid(u_gA, 0, pos),
            interolateOnGrid(u_gA, 1, pos),
            interolateOnGrid(u_gA, 2, pos)
        );
        vec3 velB = vec3(
            interolateOnGrid(u_gB, 0, pos),
            interolateOnGrid(u_gB, 1, pos),
            interolateOnGrid(u_gB, 2, pos)
        );

        val = 0.95 * (vel + (velA - velB)) + 0.05 * velA;

        gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
    }
    
    gl_PointSize = 1.0;
}