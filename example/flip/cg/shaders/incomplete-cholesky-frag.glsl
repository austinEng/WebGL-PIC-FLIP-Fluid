
precision highp float;

uniform sampler2D u_A;
uniform sampler2D u_K;
uniform ivec2 u_size;
uniform ivec2 u_tsize;
uniform int u_iter;
uniform int u_step;
varying vec2 uv;

ivec2 UVtoRC(vec2 uv) {
    ivec2 iuv = ivec2(uv * float(u_tsize.x));
    int idx = iuv.x + iuv.y * u_tsize.x;
    int c = idx / u_size.x;
    int r = idx - c * u_size.x;
    return ivec2(r, c);
}

vec2 RCtoUV(ivec2 rc) {
    int idx = rc.x + rc.y * u_size.x;
    int y = idx / u_tsize.x;
    int x = idx - y * u_tsize.x;
    return vec2(x, y) / float(u_tsize.x);
}

void main() {
    ivec2 rc = UVtoRC(uv);

    int r = rc.x;
    int c = rc.y;

    if (u_step == 0) {
        gl_FragColor = texture2D(u_A, uv);
        return;
    } else if (u_step == 1) {
        if (r == c && c == u_iter) {
            gl_FragColor = vec4(sqrt(texture2D(u_K, uv)[0]));
            return;
        }
    } else if (u_step == 2) {
        if (c == u_iter && r > c) {
            if (texture2D(u_A, uv)[0] != 0.0) {
                gl_FragColor = vec4(texture2D(u_K, uv)[0] / texture2D(u_K, RCtoUV(ivec2(c,c)))[0]);
                return;
            }
        }
    } else if (u_step == 3) {
        if (c > u_iter && r >= c) {
            if (texture2D(u_A, uv)[0] != 0.0) {
                gl_FragColor = vec4(
                    texture2D(u_K, uv)[0] - texture2D(u_K, RCtoUV(ivec2(r,u_iter)))[0] * texture2D(u_K, RCtoUV(ivec2(c,u_iter)))[0]
                );
                return;
            }
        }
    } else if (u_step == 4) {
        if (c > r) {
            gl_FragColor = vec4(0);
            return;
        }
    } else if (u_step == 5) {
        if (r == c) {
            gl_FragColor = vec4(1);
        } else if (r > c) {
            gl_FragColor = -texture2D(u_K, uv) / texture2D(u_K, RCtoUV(ivec2(r,r)))[0];
        } else {
            gl_FragColor = vec4(0);
        }
        return;
    } else if (u_step == 6) {
        if (r > c) {
            gl_FragColor = texture2D(u_K, uv) / texture2D(u_K, RCtoUV(ivec2(r,r)))[0];
        } else {
            gl_FragColor = vec4(0);
        }
        return;
    } else if (u_step == 7) {
        float val = u_iter > c ? texture2D(u_K, RCtoUV(ivec2(u_iter,c)))[0] : 0.0;
        gl_FragColor = vec4(texture2D(u_A, RCtoUV(ivec2(r,u_iter)))[0] * val);
        return;
    } else if (u_step == 8) {
        gl_FragColor = (u_iter == 0 ? 1.0 : -1.0) * texture2D(u_A, uv);
        return;
    } else if (u_step == 9) {
        gl_FragColor = texture2D(u_A, uv) / texture2D(u_K, RCtoUV(ivec2(c,c)))[0];
        return;
    } else if (u_step == 10) {
        gl_FragColor = vec4(texture2D(u_K, RCtoUV(ivec2(u_iter,c)))[0] * texture2D(u_K, RCtoUV(ivec2(u_iter,r)))[0]);
        return;
    }
    gl_FragColor = texture2D(u_K, uv);
}