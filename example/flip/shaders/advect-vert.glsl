
attribute float v_id;
uniform sampler2D u_particles;
uniform int u_particleTexLength;

uniform float u_t;
uniform vec3 u_min;
uniform vec3 u_max;
uniform float u_offset;

varying vec4 val;

@import ./include/grid;

void main() {
    int pIdx = (int(v_id) / 2) * 2;
    int vIdx = pIdx + 1;

    int isPos = int(v_id) - 2*(int(v_id) / 2);

    int pV = pIdx / u_particleTexLength;
    int pU = pIdx - pV * u_particleTexLength;

    int vV = vIdx / u_particleTexLength;
    int vU = vIdx - vV * u_particleTexLength;

    vec2 pUV = (vec2(pU, pV) + 0.01) / float(u_particleTexLength);
    vec2 vUV = (vec2(vU, vV) + 0.01) / float(u_particleTexLength);

    vec4 pos = texture2D(u_particles, pUV);
    vec4 vel = texture2D(u_particles, vUV);

    if (isPos == 1) {
        val = vel;
        gl_Position = vec4(vUV * 2.0 - 1.0, -1.0, 1.0);
    } else {
        val = vec4(clamp(pos.rgb + vel.rgb * u_t, u_min + u_offset, u_max - u_offset), pos.w);
        gl_Position = vec4(pUV * 2.0 - 1.0, -1.0, 1.0);
    }
    
    gl_PointSize = 1.0;
}