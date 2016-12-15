
precision highp float;

uniform sampler2D gU_old;
uniform sampler2D u_counts;
uniform float u_t;

varying vec2 f_uv;

void main() {
    vec4 col = texture2D(gU_old, f_uv);
    vec4 counts = texture2D(u_counts, f_uv);

    if (counts.x > 0.0) col.x /= counts.x;
    if (counts.y > 0.0) col.y /= counts.y;
    if (counts.z > 0.0) col.z /= counts.z;

    gl_FragColor = col;
}