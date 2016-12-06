ivec3 toXYZ(int idx, ivec3 count) {
    int z = idx / (count.x * count.y);
    int y = (idx - z * (count.x * count.y)) / count.x;
    int x = idx - y * count.x - z * (count.x * count.y);

    return ivec3(x,y,z);
}

int toFlat(ivec3 idx, ivec3 count) {
    return idx.x + idx.y * count.x + idx.z * count.x * count.y;
}

ivec3 UVtoXYZ(vec2 uv, int texLength, ivec3 count) {
    ivec2 pIdx = ivec2(floor(float(texLength) * uv));
    int idx = pIdx.x + pIdx.y * texLength;
    return toXYZ(idx, count);
}

vec2 XYZtoUV(ivec3 idx, int texLength, ivec3 count) {
    int i = toFlat(idx, count);
    int v = i / texLength;
    int u = i - v * texLength;
    return vec2(u, v) / float(texLength);
}

vec4 gridAt(sampler2D grid, ivec3 idx, ivec3 count, int texLength) {
    int flatIdx = toFlat(idx, count);

    int gV = flatIdx / texLength;
    int gU = flatIdx - gV * texLength;

    vec2 gUV = (vec2(gU, gV) + 0.01) / float(texLength);
    
    return texture2D(grid, gUV);
}

float gridComponentAt(sampler2D grid, ivec3 idx, ivec3 count, int texLength, int c) {
    int flatIdx = toFlat(idx, count);

    int gV = flatIdx / texLength;
    int gU = flatIdx - gV * texLength;

    vec2 gUV = (vec2(gU, gV) + 0.01) / float(texLength);
    
    for (int i = 0; i < 4; ++i) {
        if (i == c) return texture2D(grid, gUV)[i];
    }
    return 0.0;
}

bool checkIdx(ivec3 idx, ivec3 count) {
    return all(greaterThanEqual(idx, ivec3(0,0,0))) && all(lessThan(idx, count));
}

vec3 fractionalIndexOf(vec3 pos, vec3 min, float cellSize) {
    return (pos - min) / cellSize;
}

ivec3 indexOf(vec3 pos, vec3 min, float cellSize) {
    return ivec3(floor(fractionalIndexOf(pos, min, cellSize)));
}

vec3 positionOf(ivec3 idx, vec3 min, float cellSize) {
    return vec3(idx)*cellSize + min;
}

vec4 gridInterpolate(sampler2D grid, vec3 pos, vec3 min, vec3 offset, ivec3 count, int texLength, float cellSize) {
    
    vec3 fIdx = fractionalIndexOf(pos, min, cellSize) + offset;

    vec3 l = floor(fIdx);
    vec3 U = clamp(ceil(fIdx), vec3(0,0,0), vec3(count - 1));

    vec4 lll = gridAt(grid, ivec3(l.x, l.y, l.z), count, texLength);
    vec4 llU = gridAt(grid, ivec3(l.x, l.y, U.z), count, texLength);
    vec4 lUl = gridAt(grid, ivec3(l.x, U.y, l.z), count, texLength);
    vec4 lUU = gridAt(grid, ivec3(l.x, U.y, U.z), count, texLength);
    vec4 Ull = gridAt(grid, ivec3(U.x, l.y, l.z), count, texLength);
    vec4 UlU = gridAt(grid, ivec3(U.x, l.y, U.z), count, texLength);
    vec4 UUl = gridAt(grid, ivec3(U.x, U.y, l.z), count, texLength);
    vec4 UUU = gridAt(grid, ivec3(U.x, U.y, U.z), count, texLength);

    vec4 k1 = l.z == U.z ? lll : (U.z - fIdx.z) * lll + (fIdx.z - l.z) * llU;
    vec4 k2 = l.z == U.z ? lUl : (U.z - fIdx.z) * lUl + (fIdx.z - l.z) * lUU;
    vec4 k3 = l.z == U.z ? Ull : (U.z - fIdx.z) * Ull + (fIdx.z - l.z) * UlU;
    vec4 k4 = l.z == U.z ? UUl : (U.z - fIdx.z) * UUl + (fIdx.z - l.z) * UUU;

    vec4 j1 = l.y == U.y ? k1 : (U.y - fIdx.y) * k1 + (fIdx.y - l.y) * k2;
    vec4 j2 = l.y == U.y ? k3 : (U.y - fIdx.y) * k3 + (fIdx.y - l.y) * k4;

    return l.x == U.x ? j1 : (U.x - fIdx.x) * j1 + (fIdx.x - l.x) * j2;
}

float gridComponentInterpolate(sampler2D grid, vec3 pos, vec3 min, vec3 offset, ivec3 count, int texLength, float cellSize, int c) {
    
    vec3 fIdx = fractionalIndexOf(pos, min, cellSize) + offset;

    vec3 l = floor(fIdx);
    vec3 U = clamp(ceil(fIdx), vec3(0,0,0), vec3(count - 1));

    float lll = gridComponentAt(grid, ivec3(l.x, l.y, l.z), count, texLength, c);
    float llU = gridComponentAt(grid, ivec3(l.x, l.y, U.z), count, texLength, c);
    float lUl = gridComponentAt(grid, ivec3(l.x, U.y, l.z), count, texLength, c);
    float lUU = gridComponentAt(grid, ivec3(l.x, U.y, U.z), count, texLength, c);
    float Ull = gridComponentAt(grid, ivec3(U.x, l.y, l.z), count, texLength, c);
    float UlU = gridComponentAt(grid, ivec3(U.x, l.y, U.z), count, texLength, c);
    float UUl = gridComponentAt(grid, ivec3(U.x, U.y, l.z), count, texLength, c);
    float UUU = gridComponentAt(grid, ivec3(U.x, U.y, U.z), count, texLength, c);

    float k1 = l.z == U.z ? lll : (U.z - fIdx.z) * lll + (fIdx.z - l.z) * llU;
    float k2 = l.z == U.z ? lUl : (U.z - fIdx.z) * lUl + (fIdx.z - l.z) * lUU;
    float k3 = l.z == U.z ? Ull : (U.z - fIdx.z) * Ull + (fIdx.z - l.z) * UlU;
    float k4 = l.z == U.z ? UUl : (U.z - fIdx.z) * UUl + (fIdx.z - l.z) * UUU;

    float j1 = l.y == U.y ? k1 : (U.y - fIdx.y) * k1 + (fIdx.y - l.y) * k2;
    float j2 = l.y == U.y ? k3 : (U.y - fIdx.y) * k3 + (fIdx.y - l.y) * k4;

    return l.x == U.x ? j1 : (U.x - fIdx.x) * j1 + (fIdx.x - l.x) * j2;
}