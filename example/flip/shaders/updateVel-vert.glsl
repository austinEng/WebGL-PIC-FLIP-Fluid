
attribute float v_id;
uniform sampler2D u_particles;
uniform sampler2D u_gA;
uniform sampler2D u_gOld;

uniform float u_cellSize;
uniform vec3 u_min;
uniform ivec3 u_count;

uniform int u_particleTexLength;
uniform int u_gridTexLength;

uniform bool u_copy;
uniform float u_t;

varying vec3 val;


@import ./include/grid;

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
            gridComponentInterpolate(u_gA, pos, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gA, pos, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gA, pos, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );
        vec3 velB = vec3(
            gridComponentInterpolate(u_gOld, pos, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gOld, pos, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gOld, pos, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );

        velA = vec3(
            gridComponentInterpolate(u_gA, pos + velA * u_t * 0.5, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gA, pos + velA * u_t * 0.5, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gA, pos + velA * u_t * 0.5, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );
        velB = vec3(
            gridComponentInterpolate(u_gOld, pos + velB * u_t * 0.5, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gOld, pos + velB * u_t * 0.5, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gOld, pos + velB * u_t * 0.5, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );

        // val = 0.95 * (vel + (velA - velB)) + 0.05 * velA;
        val = vel + (velA - velB);
        gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
    }
    
    gl_PointSize = 1.0;
}