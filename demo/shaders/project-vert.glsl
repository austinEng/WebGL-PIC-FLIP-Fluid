
uniform vec3 u_min;
uniform ivec3 u_count;
uniform ivec3 u_goffset;
uniform float u_cellSize;
uniform int u_texLength;
uniform int u_g;
uniform bool u_weights;

attribute float v_id;
uniform sampler2D u_particles;
uniform int u_particleTexLength;
varying float keep;

varying vec4 vel;

@import ./include/grid;

void main() {
    keep = 1.0;

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

    vec3 cellOffset = vec3(0.5, 0.5, 0.5);
    if (u_g == 0) {
        cellOffset[0] = 0.0;
    } else if (u_g == 1) {
        cellOffset[1] = 0.0;
    } else if (u_g == 2) {
        cellOffset[2] = 0.0;
    }
    
    vec3 fIdx = (v_pos - u_min) / u_cellSize;
    ivec3 iIdx = ivec3(floor(fIdx)) + u_goffset;

    if (
        any(lessThan(fIdx, vec3(0,0,0))) || 
        any(greaterThanEqual(fIdx, floor(vec3(u_count) - cellOffset))) ||
        any(lessThan(vec3(iIdx), vec3(0,0,0))) || 
        any(greaterThanEqual(vec3(iIdx), floor(vec3(u_count) - cellOffset)))
    ) {   
        keep = 0.0;
        return;
    }

    float d = distance(fIdx, vec3(iIdx) + cellOffset);
    float weight = max(1.0 - d*d / 1.0, 0.0);

    vel = vec4(0.0, 0.0, 0.0, 0.0);
    if (u_g == 0) {
        if (u_weights) {
            vel[0] = weight;
        } else {
            vel[0] = weight * v_vel.x;
        }
    } else if (u_g == 1) {
        if (u_weights) {
            vel[1] = weight;
        } else {
            vel[1] = weight * v_vel.y;
        }
    } else if (u_g == 2) {
        if (u_weights) {
            vel[2] = weight;
        } else {
            vel[2] = weight * v_vel.z;
        }
    }

    int flatIdx = toFlat(iIdx, u_count);

    int t = flatIdx / u_texLength;
    int s = flatIdx - t * u_texLength;
    vec2 st = (vec2(s, t) + 0.01) / float(u_texLength);

    gl_Position = vec4(st * 2.0 - 1.0, -1.0, 1.0);
    gl_PointSize = 1.0;
}