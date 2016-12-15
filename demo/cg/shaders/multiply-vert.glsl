
uniform sampler2D u_A;
uniform sampler2D u_B;

uniform ivec2 u_Asize;
uniform ivec2 u_Bsize;
uniform ivec2 u_Csize;
uniform int u_Atsize;
uniform int u_Btsize;
uniform int u_Ctsize;

attribute float idx;

varying vec4 result;

ivec2 UVtoRC(vec2 uv, ivec2 size, int tsize) {
    ivec2 iuv = ivec2(uv * float(tsize));
    int idx = iuv.x + iuv.y * tsize;
    int c = idx / size.x;
    int r = idx - c * size.x;
    return ivec2(r, c);
}

vec2 RCtoUV(ivec2 rc, ivec2 size, int tsize) {
    int idx = rc.x + rc.y * size.x;
    int y = idx / tsize;
    int x = idx - y * tsize;
    return vec2(x, y) / float(tsize);
}

// compute A * B
void main() {

    int midx = int(idx);                // overall multiplication index
    int ridx = midx / u_Asize.y;        // result index
    int didx = midx - ridx * u_Asize.y; // dot product index

    int rc = ridx / u_Csize.x;
    int rr = ridx - rc * u_Csize.x;

    vec4 result = texture2D(u_A, RCtoUV(ivec2(rr, didx), u_Asize, u_Atsize)) * texture2D(u_B, RCtoUV(ivec2(didx, rc), u_Bsize, u_Btsize));

    gl_Position = vec4(vec2(
        ridx / u_Ctsize,
        ridx - (ridx / u_Ctsize) * u_Ctsize
    ) / float(u_Ctsize) * 2.0 - 1.0, -1.0, 1.0);
    gl_PointSize = 1.0;
}