
uniform vec3 u_min;
uniform vec3 u_max;
uniform float u_cellSize;
uniform int u_texLength;

attribute float v_id;
uniform sampler2D u_particles;
uniform int u_particleTexLength;

varying float type;

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

    vec3 offset = vec3(0.5, 0.5, 0.5) * u_cellSize;
    ivec3 count = ivec3(ceil((u_max - u_min - offset) / u_cellSize));

    vec3 fIdx = clamp((v_pos - offset - u_min) / u_cellSize, vec3(0.0,0.0,0.0), vec3(count));
    ivec3 iIdx = ivec3(clamp(floor(fIdx), vec3(0.0,0.0,0.0), vec3(count)));
    int flatIdx = iIdx.x + iIdx.y * count.x + iIdx.z * count.x * count.y;

    int t = flatIdx / u_texLength;
    int s = flatIdx - t * u_texLength;
    vec2 st = (vec2(s, t) + 0.1) / float(u_texLength);

    gl_Position = vec4(st * 2.0 - 1.0, -1.0, 1.0);
    gl_PointSize = 1.0;
}