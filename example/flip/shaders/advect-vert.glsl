
attribute float v_id;
uniform sampler2D u_particles;
uniform int u_particleTexLength;

varying vec3 pos;
varying vec3 vel;

void main() {
    int pIdx = int(v_id) * 2;
    int vIdx = int(v_id) * 2 + 1;

    int pV = pIdx / u_particleTexLength;
    int pU = pIdx - pV * u_particleTexLength;

    int vV = vIdx / u_particleTexLength;
    int vU = vIdx - vV * u_particleTexLength;

    vec2 pUV = (vec2(pU, pV) + 0.01) / float(u_particleTexLength);
    vec2 vUV = (vec2(vU, vV) + 0.01) / float(u_particleTexLength);

    pos = texture2D(u_particles, pUV).rgb;
    vel = texture2D(u_particles, vUV).rgb;

    gl_Position = vec4(pUV * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = 1.0;
}