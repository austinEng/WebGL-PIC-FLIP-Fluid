
precision highp float;

uniform sampler2D u_grid;
uniform sampler2D u_types;
uniform int u_texLength;
uniform float u_cellSize;
uniform ivec3 u_count;

varying vec2 f_uv;

@import ./include/grid;

void main() {
    ivec3 idx = UVtoXYZ(f_uv, u_texLength, u_count);

    if (!checkIdx(idx, u_count)) {
        discard;
    }

    vec4 current = texture2D(u_grid, f_uv);

    ivec3 tCount = u_count - ivec3(1,1,1);
    ivec3 xCount = u_count - ivec3(0,1,1);
    ivec3 yCount = u_count - ivec3(1,0,1);
    ivec3 zCount = u_count - ivec3(1,1,0);

    if (
        checkIdx(idx, xCount) &&
        ((checkIdx(idx + ivec3(-1,0,0), tCount) &&
        gridComponentAt(u_types, idx + ivec3(-1,0,0), u_count, u_texLength, 0) != 1.0) ||
        (checkIdx(idx, tCount) &&
        gridComponentAt(u_types, idx, u_count, u_texLength, 0) != 1.0))
    ) {
        bool fromU = (checkIdx(idx + ivec3(-1, 1, 0), tCount) && gridComponentAt(u_types, idx + ivec3(-1, 1, 0), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0, 1, 0), tCount) && gridComponentAt(u_types, idx + ivec3( 0, 1, 0), u_count, u_texLength, 0) == 1.0);
        bool fromD = (checkIdx(idx + ivec3(-1,-1, 0), tCount) && gridComponentAt(u_types, idx + ivec3(-1,-1, 0), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0,-1, 0), tCount) && gridComponentAt(u_types, idx + ivec3( 0,-1, 0), u_count, u_texLength, 0) == 1.0);
        bool fromF = (checkIdx(idx + ivec3(-1, 0, 1), tCount) && gridComponentAt(u_types, idx + ivec3(-1, 0, 1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0, 0, 1), tCount) && gridComponentAt(u_types, idx + ivec3( 0, 0, 1), u_count, u_texLength, 0) == 1.0);
        bool fromB = (checkIdx(idx + ivec3(-1, 0,-1), tCount) && gridComponentAt(u_types, idx + ivec3(-1, 0,-1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0, 0,-1), tCount) && gridComponentAt(u_types, idx + ivec3( 0, 0,-1), u_count, u_texLength, 0) == 1.0);
        float val = 0.0;

        int count = int(fromU) + int(fromD) + int(fromF) + int(fromB);
        if (fromU) val += gridComponentAt(u_grid, idx + ivec3(0, 1, 0), u_count, u_texLength, 0);
        if (fromD) val += gridComponentAt(u_grid, idx + ivec3(0,-1, 0), u_count, u_texLength, 0);
        if (fromF) val += gridComponentAt(u_grid, idx + ivec3(0, 0, 1), u_count, u_texLength, 0);
        if (fromB) val += gridComponentAt(u_grid, idx + ivec3(0, 0,-1), u_count, u_texLength, 0);

        if (count > 0) {
            current.x = val / float(count);
        }
    }

    if (
        checkIdx(idx, yCount) &&
        ((checkIdx(idx + ivec3(0,-1,0), tCount) &&
        gridComponentAt(u_types, idx + ivec3(0,-1,0), u_count, u_texLength, 0) != 1.0) ||
        (checkIdx(idx, tCount) &&
        gridComponentAt(u_types, idx, u_count, u_texLength, 0) != 1.0))
    ) {
        bool fromU = (checkIdx(idx + ivec3( 1,-1, 0), tCount) && gridComponentAt(u_types, idx + ivec3( 1,-1, 0), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 1, 0, 0), tCount) && gridComponentAt(u_types, idx + ivec3( 1, 0, 0), u_count, u_texLength, 0) == 1.0);
        bool fromD = (checkIdx(idx + ivec3(-1,-1, 0), tCount) && gridComponentAt(u_types, idx + ivec3(-1,-1, 0), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3(-1, 0, 0), tCount) && gridComponentAt(u_types, idx + ivec3(-1, 0, 0), u_count, u_texLength, 0) == 1.0);
        bool fromF = (checkIdx(idx + ivec3( 0,-1, 1), tCount) && gridComponentAt(u_types, idx + ivec3( 0,-1, 1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0, 0, 1), tCount) && gridComponentAt(u_types, idx + ivec3( 0, 0, 1), u_count, u_texLength, 0) == 1.0);
        bool fromB = (checkIdx(idx + ivec3( 0,-1,-1), tCount) && gridComponentAt(u_types, idx + ivec3( 0,-1,-1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0, 0,-1), tCount) && gridComponentAt(u_types, idx + ivec3( 0, 0,-1), u_count, u_texLength, 0) == 1.0);
        float val = 0.0;

        int count = int(fromU) + int(fromD) + int(fromF) + int(fromB);
        if (fromU) val += gridComponentAt(u_grid, idx + ivec3( 1, 0, 0), u_count, u_texLength, 1);
        if (fromD) val += gridComponentAt(u_grid, idx + ivec3(-1, 0, 0), u_count, u_texLength, 1);
        if (fromF) val += gridComponentAt(u_grid, idx + ivec3( 0, 0, 1), u_count, u_texLength, 1);
        if (fromB) val += gridComponentAt(u_grid, idx + ivec3( 0, 0,-1), u_count, u_texLength, 1);

        if (count > 0) {
            current.y = val / float(count);
        }
    }

    if (
        checkIdx(idx, zCount) &&
        ((checkIdx(idx + ivec3(0,0,-1), tCount) &&
        gridComponentAt(u_types, idx + ivec3(0,0,-1), u_count, u_texLength, 0) != 1.0) ||
        (checkIdx(idx, tCount) &&
        gridComponentAt(u_types, idx, u_count, u_texLength, 0) != 1.0))
    ) {
        bool fromU = (checkIdx(idx + ivec3( 1, 0,-1), tCount) && gridComponentAt(u_types, idx + ivec3( 1, 0,-1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 1, 0, 0), tCount) && gridComponentAt(u_types, idx + ivec3( 1, 0, 0), u_count, u_texLength, 0) == 1.0);
        bool fromD = (checkIdx(idx + ivec3(-1, 0,-1), tCount) && gridComponentAt(u_types, idx + ivec3(-1, 0,-1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3(-1, 0, 0), tCount) && gridComponentAt(u_types, idx + ivec3(-1, 0, 0), u_count, u_texLength, 0) == 1.0);
        bool fromF = (checkIdx(idx + ivec3( 0, 1,-1), tCount) && gridComponentAt(u_types, idx + ivec3( 0, 1,-1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0, 1, 0), tCount) && gridComponentAt(u_types, idx + ivec3( 0, 1, 0), u_count, u_texLength, 0) == 1.0);
        bool fromB = (checkIdx(idx + ivec3( 0,-1,-1), tCount) && gridComponentAt(u_types, idx + ivec3( 0,-1,-1), u_count, u_texLength, 0) == 1.0) ||
                     (checkIdx(idx + ivec3( 0,-1, 0), tCount) && gridComponentAt(u_types, idx + ivec3( 0,-1, 0), u_count, u_texLength, 0) == 1.0);
        float val = 0.0;

        int count = int(fromU) + int(fromD) + int(fromF) + int(fromB);
        if (fromU) val += gridComponentAt(u_grid, idx + ivec3( 1, 0, 0), u_count, u_texLength, 2);
        if (fromD) val += gridComponentAt(u_grid, idx + ivec3(-1, 0, 0), u_count, u_texLength, 2);
        if (fromF) val += gridComponentAt(u_grid, idx + ivec3( 0, 1, 0), u_count, u_texLength, 2);
        if (fromB) val += gridComponentAt(u_grid, idx + ivec3( 0,-1, 0), u_count, u_texLength, 2);

        if (count > 0) {
            current.z = val / float(count);
        }
    }
    
    gl_FragColor = current;
}