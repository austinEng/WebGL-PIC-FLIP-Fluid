
// uniform bvec3 u_iter;
uniform vec3 u_min;
uniform vec3 u_max;
// uniform vec3 u_offset;
// uniform ivec3 u_count;
uniform ivec3 u_goffset;
uniform float u_cellSize;
uniform int u_texLength;
uniform int u_g;

// attribute vec3 v_pos;
// attribute vec3 v_vel;

attribute float v_id;
uniform sampler2D u_particles;
uniform int u_particleTexLength;

varying vec4 vel;

void main() {

    int pIdx = int(v_id) * 2;
    int vIdx = int(v_id) * 2 + 1;

    int pV = pIdx / u_particleTexLength;
    int pU = pIdx - pV * u_particleTexLength;

    int vV = vIdx / u_particleTexLength;
    int vU = vIdx - vV * u_particleTexLength;

    vec2 pUV = (vec2(pU, pV) + 0.01) / float(u_particleTexLength);
    vec2 vUV = (vec2(vU, vV) + 0.01) / float(u_particleTexLength);

    vec3 v_pos = texture2D(u_particles, pUV).rgb;
    vec3 v_vel = texture2D(u_particles, vUV).rgb;

    vec3 offset = vec3(0.5, 0.5, 0.5) * u_cellSize;
    if (u_g == 0) {
        offset[0] = 0.0;
    } else if (u_g == 1) {
        offset[1] = 0.0;
    } else if (u_g == 2) {
        offset[2] = 0.0;
    }

    ivec3 count = ivec3(ceil((u_max - u_min - offset) / u_cellSize));

    vec3 fIdx = clamp((v_pos - offset - u_min) / u_cellSize, vec3(0.0,0.0,0.0), vec3(count));
    ivec3 iIdx = ivec3(clamp(floor(fIdx) + vec3(u_goffset), vec3(0.0,0.0,0.0), vec3(count)));
    int flatIdx = iIdx.x + iIdx.y * count.x + iIdx.z * count.x * count.y;

    int t = flatIdx / u_texLength;
    int s = flatIdx - t * u_texLength;
    vec2 st = (vec2(s, t) + 0.1) / float(u_texLength);

    float d = distance(fIdx, vec3(iIdx));
    float weight = max(1.0 - d*d / 2.0, 0.0);

    vel = vec4(0.0, 0.0, 0.0, weight > 0.0);
    if (u_g == 0) {
        vel[0] = weight * v_vel.x;
    } else if (u_g == 1) {
        vel[1] = weight * v_vel.y;
    } else if (u_g == 2) {
        vel[2] = weight * v_vel.z;
    }

    gl_Position = vec4(st * 2.0 - 1.0, -1.0, 1.0);
}