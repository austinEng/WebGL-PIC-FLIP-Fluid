
attribute vec2 v_pos;

varying vec2 f_uv;

 void main() {
     f_uv = v_pos * 0.5 + 0.5;
     gl_Position = vec4(v_pos, 0.0, 1.0);
 }