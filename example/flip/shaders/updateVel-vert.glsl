
attribute float v_id;
uniform sampler2D u_particles;
uniform sampler2D u_gA;
uniform sampler2D u_gOld;

uniform float u_cellSize;
uniform vec3 u_min;
uniform vec3 u_max;
uniform ivec3 u_count;

uniform int u_particleTexLength;
uniform int u_gridTexLength;

uniform bool u_copy;

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

        vec3 xOffset = vec3(0, u_cellSize*0.5, u_cellSize*0.5);
        vec3 yOffset = vec3(u_cellSize*0.5, 0, u_cellSize*0.5);
        vec3 zOffset = vec3(u_cellSize*0.5, u_cellSize*0.5, 0);

        ivec3 xCount = gridCount(xOffset, u_max, u_min, u_cellSize);
        ivec3 yCount = gridCount(yOffset, u_max, u_min, u_cellSize);
        ivec3 zCount = gridCount(zOffset, u_max, u_min, u_cellSize);

        vec3 velA = vec3(
            gridComponentInterpolate(u_gA, pos, u_min, xOffset, xCount, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gA, pos, u_min, yOffset, yCount, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gA, pos, u_min, zOffset, zCount, u_gridTexLength, u_cellSize, 2)
        );
        vec3 velB = vec3(
            gridComponentInterpolate(u_gOld, pos, u_min, xOffset, xCount, u_gridTexLength, u_cellSize, 0),
            gridComponentInterpolate(u_gOld, pos, u_min, yOffset, yCount, u_gridTexLength, u_cellSize, 1),
            gridComponentInterpolate(u_gOld, pos, u_min, zOffset, zCount, u_gridTexLength, u_cellSize, 2)
        );

        // val = 0.95 * (vel + (velA - velB)) + 0.05 * velA;
        val = vel + (velA - velB);
        // val = velA;
        gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
    }
    
    gl_PointSize = 1.0;
}