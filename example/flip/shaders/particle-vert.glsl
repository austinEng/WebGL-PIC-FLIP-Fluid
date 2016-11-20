
uniform mat4 u_viewProj;

attribute vec3 v_pos;
attribute vec3 v_vel;

varying vec3 f_col;

void main() {
    f_col = v_vel;
    gl_Position = u_viewProj * vec4(v_pos, 1.0);
    gl_PointSize = 3.0;
}