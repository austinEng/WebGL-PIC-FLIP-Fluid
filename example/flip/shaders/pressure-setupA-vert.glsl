
attribute float v_id;
uniform ivec3 u_count;
uniform sampler2D u_types;
uniform int u_textureLength;
uniform float u_scale;
varying vec4 val;
varying float keep;

@import ./include/grid;

void main() {
  keep = 1.0;
  gl_PointSize = 1.0;

  int id = int(v_id);

  ivec3 idx = toXYZ(id / 6, u_count);

  // if (idx.x >= u_count.x - 1 || 
  //     idx.y >= u_count.y - 1 || 
  //     idx.z >= u_count.z - 1) {
  //       keep = 0.0;
  //       return;
  //     }

  int offsetID = id - (id / 6) * 6;
  bool isPlusGrid = false;
  int gridDir = 0;
  ivec3 offset;
  if (offsetID == 0) {
    offset = ivec3(1,0,0);
    gridDir = 0;
  } else if (offsetID == 1) {
    offset = ivec3(1,0,0);
    gridDir = 0;
    isPlusGrid = true;
  } else if (offsetID == 2) {
    offset = ivec3(0,1,0);
    gridDir = 1;
  } else if (offsetID == 3) {
    offset = ivec3(0,1,0);
    gridDir = 1;
    isPlusGrid = true;
  } else if (offsetID == 4) {
    offset = ivec3(0,0,1);
    gridDir = 2;
  } else if (offsetID == 5) {
    offset = ivec3(0,0,1);
    gridDir = 2;
    isPlusGrid = true;
  }

  float typeA = gridAt(u_types, idx, u_count, u_textureLength)[0];
  float typeB = gridAt(u_types, idx + offset, u_count, u_textureLength)[0];

  if (isPlusGrid) {
    gl_Position = vec4(XYZtoUV(idx + offset, u_textureLength, u_count) * 2.0 - 1.0, 0.0, 1.0);
  } else {
    gl_Position = vec4(XYZtoUV(idx, u_textureLength, u_count) * 2.0 - 1.0, 0.0, 1.0);
  }

  if (typeA == 1.0 && typeB == 1.0) {
    if (isPlusGrid) {
      val = vec4(0,0,0,u_scale);
    } else {
      val = vec4(0,0,0,u_scale);
      if (gridDir == 0) {
        val[0] = -u_scale;
      } else if (gridDir == 1) {
        val[1] = -u_scale;
      } else if (gridDir == 2) {
        val[2] = -u_scale;
      }
    }
  } else if (typeA == 1.0 && typeB == 0.0) {
    if (isPlusGrid) {
      keep = 0.0;
      return;
    } else {
      val = vec4(0,0,0,u_scale);
    }
  }
}