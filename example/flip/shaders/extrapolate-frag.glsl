
precision highp float;

uniform sampler2D u_grid;
uniform sampler2D u_types;
uniform int u_texLength;
uniform vec3 u_min;
uniform vec3 u_max;
uniform float u_cellSize;

varying vec2 f_uv;
// varying float id;

@import ./include/grid;

void main() {
    vec3 xOffset = vec3(0,   0.5, 0.5) * u_cellSize;
    vec3 yOffset = vec3(0.5, 0,   0.5) * u_cellSize;
    vec3 zOffset = vec3(0.5, 0.5, 0  ) * u_cellSize;
    vec3 tOffset = vec3(0.5, 0.5, 0.5) * u_cellSize;
    vec3 offset = vec3(0,0,0);

    ivec3 xCount = gridCount(xOffset, u_max, u_min, u_cellSize);
    ivec3 yCount = gridCount(yOffset, u_max, u_min, u_cellSize);
    ivec3 zCount = gridCount(zOffset, u_max, u_min, u_cellSize);
    ivec3 tCount = gridCount(tOffset, u_max, u_min, u_cellSize);
    ivec3 count = gridCount(offset, u_max, u_min, u_cellSize);

    ivec3 uIdx = UVtoXYZ(f_uv, u_texLength, xCount);
    ivec3 vIdx = UVtoXYZ(f_uv, u_texLength, yCount);
    ivec3 wIdx = UVtoXYZ(f_uv, u_texLength, zCount);
    ivec3 tIdx = UVtoXYZ(f_uv, u_texLength, tCount);
    ivec3 idx = UVtoXYZ(f_uv, u_texLength, count);

    // uIdx = indexOf(positionOf(idx, u_min, offset, u_cellSize), u_min, xCount, u_cellSize, xOffset);
    // vIdx = indexOf(positionOf(idx, u_min, offset, u_cellSize), u_min, yCount, u_cellSize, yOffset);
    // wIdx = indexOf(positionOf(idx, u_min, offset, u_cellSize), u_min, zCount, u_cellSize, zOffset);
    // tIdx = indexOf(positionOf(idx, u_min, offset, u_cellSize), u_min, tCount, u_cellSize, tOffset);

    // ivec3 uIdx = toXYZ(int(id), xCount);
    // ivec3 vIdx = toXYZ(int(id), yCount);
    // ivec3 wIdx = toXYZ(int(id), zCount);
    // ivec3 tIdx = toXYZ(int(id), tCount);
    // ivec3 idx = toXYZ(int(id), count);

    if (!checkIdx(idx, count)) {
        discard;
        return;
    }

    vec4 current = texture2D(u_grid, f_uv);
    // vec4 current = gridAt(u_grid, idx, count, u_texLength);

    if (
        checkIdx(uIdx, xCount) && ((
            checkIdx(uIdx + ivec3(-1,0,0), tCount) &&
            gridComponentAt(u_types, uIdx + ivec3(-1,0,0), tCount, u_texLength, 0) != 1.0
        ) ||
        (
            checkIdx(uIdx, tCount) &&
            gridComponentAt(u_types, uIdx, tCount, u_texLength, 0) != 1.0
        ))
    ) {
        bool fromU = (checkIdx(uIdx + ivec3(-1, 1, 0), tCount) && gridComponentAt(u_types, uIdx + ivec3(-1, 1, 0), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(uIdx + ivec3( 0, 1, 0), tCount) && gridComponentAt(u_types, uIdx + ivec3( 0, 1, 0), tCount, u_texLength, 0) == 1.0);
        bool fromD = (checkIdx(uIdx + ivec3(-1,-1, 0), tCount) && gridComponentAt(u_types, uIdx + ivec3(-1,-1, 0), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(uIdx + ivec3( 0,-1, 0), tCount) && gridComponentAt(u_types, uIdx + ivec3( 0,-1, 0), tCount, u_texLength, 0) == 1.0);
        bool fromF = (checkIdx(uIdx + ivec3(-1, 0, 1), tCount) && gridComponentAt(u_types, uIdx + ivec3(-1, 0, 1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(uIdx + ivec3( 0, 0, 1), tCount) && gridComponentAt(u_types, uIdx + ivec3( 0, 0, 1), tCount, u_texLength, 0) == 1.0);
        bool fromB = (checkIdx(uIdx + ivec3(-1, 0,-1), tCount) && gridComponentAt(u_types, uIdx + ivec3(-1, 0,-1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(uIdx + ivec3( 0, 0,-1), tCount) && gridComponentAt(u_types, uIdx + ivec3( 0, 0,-1), tCount, u_texLength, 0) == 1.0);
        float val = 0.0;

        int count = int(fromU) + int(fromD) + int(fromF) + int(fromB);
        if (fromU) val += gridComponentAt(u_grid, uIdx + ivec3(0, 1, 0), xCount, u_texLength, 0);
        if (fromD) val += gridComponentAt(u_grid, uIdx + ivec3(0,-1, 0), xCount, u_texLength, 0);
        if (fromF) val += gridComponentAt(u_grid, uIdx + ivec3(0, 0, 1), xCount, u_texLength, 0);
        if (fromB) val += gridComponentAt(u_grid, uIdx + ivec3(0, 0,-1), xCount, u_texLength, 0);

        if (count > 0) {
            current.x = val / float(count);
        }
    }

    if (
        checkIdx(vIdx, yCount) && ((
            checkIdx(vIdx + ivec3(0,-1,0), tCount) &&
            gridComponentAt(u_types, vIdx + ivec3(0,-1,0), tCount, u_texLength, 0) != 1.0
        ) ||
        (
            checkIdx(vIdx, tCount) &&
            gridComponentAt(u_types, vIdx, tCount, u_texLength, 0) != 1.0
        ))
    ) {
        bool fromU = (checkIdx(vIdx + ivec3( 1,-1, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3( 1,-1, 0), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(vIdx + ivec3( 1, 0, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3( 1, 0, 0), tCount, u_texLength, 0) == 1.0);
        bool fromD = (checkIdx(vIdx + ivec3(-1,-1, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3(-1,-1, 0), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(vIdx + ivec3(-1, 0, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3(-1, 0, 0), tCount, u_texLength, 0) == 1.0);
        bool fromF = (checkIdx(vIdx + ivec3( 0,-1, 1), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0,-1, 1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(vIdx + ivec3( 0, 0, 1), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0, 0, 1), tCount, u_texLength, 0) == 1.0);
        bool fromB = (checkIdx(vIdx + ivec3( 0,-1,-1), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0,-1,-1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(vIdx + ivec3( 0, 0,-1), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0, 0,-1), tCount, u_texLength, 0) == 1.0);
        float val = 0.0;

        int count = int(fromU) + int(fromD) + int(fromF) + int(fromB);
        if (fromU) val += gridComponentAt(u_grid, vIdx + ivec3( 1, 0, 0), yCount, u_texLength, 1);
        if (fromD) val += gridComponentAt(u_grid, vIdx + ivec3(-1, 0, 0), yCount, u_texLength, 1);
        if (fromF) val += gridComponentAt(u_grid, vIdx + ivec3( 0, 0, 1), yCount, u_texLength, 1);
        if (fromB) val += gridComponentAt(u_grid, vIdx + ivec3( 0, 0,-1), yCount, u_texLength, 1);

        if (count > 0) {
            current.y = val / float(count);
        }
    }

    if (
        checkIdx(wIdx, zCount) && ((
            checkIdx(wIdx + ivec3(0,0,-1), tCount) &&
            gridComponentAt(u_types, wIdx + ivec3(0,0,-1), tCount, u_texLength, 0) != 1.0
        ) ||
        (
            checkIdx(vIdx, tCount) &&
            gridComponentAt(u_types, wIdx, tCount, u_texLength, 0) != 1.0
        ))
    ) {
        bool fromU = (checkIdx(wIdx + ivec3( 1, 0,-1), tCount) && gridComponentAt(u_types, vIdx + ivec3( 1, 0,-1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(wIdx + ivec3( 1, 0, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3( 1, 0, 0), tCount, u_texLength, 0) == 1.0);
        bool fromD = (checkIdx(wIdx + ivec3(-1, 0,-1), tCount) && gridComponentAt(u_types, vIdx + ivec3(-1, 0,-1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(wIdx + ivec3(-1, 0, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3(-1, 0, 0), tCount, u_texLength, 0) == 1.0);
        bool fromF = (checkIdx(wIdx + ivec3( 0, 1,-1), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0, 1,-1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(wIdx + ivec3( 0, 1, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0, 1, 0), tCount, u_texLength, 0) == 1.0);
        bool fromB = (checkIdx(wIdx + ivec3( 0,-1,-1), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0,-1,-1), tCount, u_texLength, 0) == 1.0) ||
                     (checkIdx(wIdx + ivec3( 0,-1, 0), tCount) && gridComponentAt(u_types, vIdx + ivec3( 0,-1, 0), tCount, u_texLength, 0) == 1.0);
        float val = 0.0;

        int count = int(fromU) + int(fromD) + int(fromF) + int(fromB);
        if (fromU) val += gridComponentAt(u_grid, wIdx + ivec3( 1, 0, 0), zCount, u_texLength, 2);
        if (fromD) val += gridComponentAt(u_grid, wIdx + ivec3(-1, 0, 0), zCount, u_texLength, 2);
        if (fromF) val += gridComponentAt(u_grid, wIdx + ivec3( 0, 1, 0), zCount, u_texLength, 2);
        if (fromB) val += gridComponentAt(u_grid, wIdx + ivec3( 0,-1, 0), zCount, u_texLength, 2);

        if (count > 0) {
            current.z = val / float(count);
        }
    }
    
    gl_FragColor = current;
}