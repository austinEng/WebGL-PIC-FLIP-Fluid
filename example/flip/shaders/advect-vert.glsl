
attribute float v_id;
uniform sampler2D u_particles;
uniform int u_particleTexLength;

uniform bool u_copy;
uniform float u_t;
uniform vec3 u_min;
uniform vec3 u_max;

varying vec3 val;

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
        vec3 futurePos = pos + vel * u_t;
        if (futurePos.x < u_min.x || futurePos.x >= u_max.x) {
            vel.x *= -1.0;
        }
        if (futurePos.y < u_min.y || futurePos.y >= u_max.y) {
            vel.y *= -1.0;
        }
        if (futurePos.z < u_min.z || futurePos.z >= u_max.z) {
            vel.z *= -1.0;
        }

        val = vel;
        gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
    } else {
        val = clamp(pos + vel * u_t, u_min, u_max);
        gl_Position = vec4(pUV * 2.0 - 1.0, 0.0, 1.0);
    }
    
    gl_PointSize = 1.0;
}