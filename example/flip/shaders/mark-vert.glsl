
uniform vec3 u_min;
uniform ivec3 u_count;
uniform float u_cellSize;
uniform int u_texLength;

attribute float v_id;
uniform sampler2D u_particles;
uniform int u_particleTexLength;
uniform bool u_near;

varying float type;

@import ./include/grid;

void main() {
    int _type;
    int pIdx;
    int vIdx;

    if (u_near) {
        pIdx = (int(v_id) / 6) * 2;
        vIdx = (int(v_id) / 6) * 2 + 1;

        _type = int(v_id) - (int(v_id) / 6) * 6;

    } else {
        pIdx = int(v_id) * 2;
        vIdx = int(v_id) * 2 + 1;
    }

    int pV = pIdx / u_particleTexLength;
    int pU = pIdx - pV * u_particleTexLength;

    int vV = vIdx / u_particleTexLength;
    int vU = vIdx - vV * u_particleTexLength;

    vec2 pUV = (vec2(pU, pV) + 0.01) / float(u_particleTexLength);
    vec2 vUV = (vec2(vU, vV) + 0.01) / float(u_particleTexLength);

    vec3 v_pos = texture2D(u_particles, pUV).rgb;
    // vec3 v_vel = texture2D(u_particles, vUV).rgb;

    ivec3 idx = indexOf(v_pos, u_min, u_cellSize);
    idx = ivec3(clamp(vec3(idx), vec3(0,0,0), vec3(u_count - 2)));

    ivec3 oldIdx = idx;

    // if (type == 0) {

    // } else if (type == 1) {
    //     idx += ivec3(1, 0, 0);
    // } else if (type == 2) {
    //     idx -= ivec3(1, 0, 0);
    // } else if (type == 3) {
    //     idx += ivec3(0, 1, 0);
    // } else if (type == 4) {
    //     idx -= ivec3(0, 1, 0);
    // } else if (type == 5) {
    //     idx += ivec3(0, 0, 1);
    // } else if (type == 6) {
    //     idx -= ivec3(0, 0, 1);
    // }

    if (u_near) {
        if (_type == 1) {
            idx += ivec3(1, 0, 0);
        } else if (_type == 2) {
            idx -= ivec3(1, 0, 0);
        } else if (_type == 3) {
            idx += ivec3(0, 1, 0);
        } else if (_type == 4) {
            idx -= ivec3(0, 1, 0);
        } else if (_type == 5) {
            idx += ivec3(0, 0, 1);
        } else if (_type == 6) {
            idx -= ivec3(0, 0, 1);
        }
        type = 1.0;
    } else {
        type = 1.0;
    }

    if (!checkIdx(idx, u_count)) {
        idx = oldIdx;
    }

    int flatIdx = toFlat(idx, u_count);
    int t = flatIdx / u_texLength;
    int s = flatIdx - t * u_texLength;
    vec2 st = (vec2(s, t) + 0.1) / float(u_texLength);
    gl_Position = vec4(st * 2.0 - 1.0, -1.0, 1.0);
    gl_PointSize = 1.0;
}