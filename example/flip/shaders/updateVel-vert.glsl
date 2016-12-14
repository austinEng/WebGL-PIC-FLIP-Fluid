
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

varying vec4 val;


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

    vec4 pos = texture2D(u_particles, pUV);
    vec4 vel = texture2D(u_particles, vUV);

    if (u_copy) {
        val = pos;
        gl_Position = vec4(pUV * 2.0 - 1.0, 0.0, 1.0);
    } else {

        vec3 velA = vec3(
            gridComponentInterpolate(u_gA, pos.rgb, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gA, pos.rgb, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gA, pos.rgb, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );
        vec3 velB = vec3(
            gridComponentInterpolate(u_gOld, pos.rgb, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gOld, pos.rgb, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gOld, pos.rgb, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );

        velA = vec3(
            gridComponentInterpolate(u_gA, pos.rgb + velA * u_t * 0.5, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gA, pos.rgb + velA * u_t * 0.5, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gA, pos.rgb + velA * u_t * 0.5, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );
        velB = vec3(
            gridComponentInterpolate(u_gOld, pos.rgb + velB * u_t * 0.5, u_min, -vec3(0,0.5,0.5), u_count, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gOld, pos.rgb + velB * u_t * 0.5, u_min, -vec3(0.5,0,0.5), u_count, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gOld, pos.rgb + velB * u_t * 0.5, u_min, -vec3(0.5,0.5,0), u_count, u_gridTexLength, u_cellSize, 2)
        );

        val.rgb = 0.95 * (vel.rgb + (velA - velB)) + 0.05 * velA;
        val.a = vel.w;
        // val = vel + (velA - velB);
        gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
    }
    
    gl_PointSize = 1.0;
}