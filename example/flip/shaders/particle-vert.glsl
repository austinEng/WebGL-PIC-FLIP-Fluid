
uniform mat4 u_viewProj;

// attribute vec3 v_pos;
// attribute vec3 v_vel;
attribute float v_id;
uniform sampler2D u_particles;
uniform int u_texLength;

varying vec3 f_col;

void main() {
    int pIdx = int(v_id) * 2;
    int vIdx = int(v_id) * 2 + 1;

    int pV = pIdx / u_texLength;
    int pU = pIdx - pV * u_texLength;

    int vV = vIdx / u_texLength;
    int vU = vIdx - vV * u_texLength;

    vec2 pUV = (vec2(pU, pV) + 0.1) / float(u_texLength);
    vec2 vUV = (vec2(vU, vV) + 0.1) / float(u_texLength);

    vec3 v_pos = texture2D(u_particles, pUV).rgb;
    vec3 v_vel = abs(normalize(texture2D(u_particles, vUV).rgb));

    f_col = v_vel; // v_pos + vec3(0.5, 0.5, 0.5);
    gl_Position = u_viewProj * vec4(v_pos, 1.0);
    gl_PointSize = 1.0;
}