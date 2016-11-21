'use strict'

function Painters(gl) {

  const {getShader, addShaders} = require('./util')(gl);

  var ParticlePainter
  var GridPainter

    (function() {
      var prog = gl.createProgram()

      var vs = getShader(require('./shaders/particle-vert.glsl'), gl.VERTEX_SHADER);
      var fs = getShader(require('./shaders/particle-frag.glsl'), gl.FRAGMENT_SHADER);
      addShaders(prog, [vs, fs]);

      var v_id = gl.getAttribLocation(prog, "v_id")
      var u_particles = gl.getUniformLocation(prog, "u_particles")
      var u_texLength = gl.getUniformLocation(prog, "u_texLength")
      var u_viewProj = gl.getUniformLocation(prog, "u_viewProj")

      ParticlePainter = function(particles) {
        function draw(state) {
          gl.useProgram(prog)
          
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
          gl.uniform1i(u_particles, 0)

          gl.uniform1i(u_texLength, particles.textureLength)

          gl.uniformMatrix4fv(u_viewProj, false, state.cameraMat.elements);

          // if (v_pos >= 0) gl.enableVertexAttribArray(v_pos)
          // if (v_vel >= 0) gl.enableVertexAttribArray(v_vel)

          // if (v_pos >= 0) gl.vertexAttribPointer(v_pos, 3, gl.FLOAT, false, 4 * 3 * 2, 0)
          // if (v_vel >= 0) gl.vertexAttribPointer(v_vel, 3, gl.FLOAT, false, 4 * 3 * 2, 4 * 3)
          // console.log(particles)
          
          gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
          gl.enableVertexAttribArray(v_id)
          gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)
          gl.drawArrays(gl.POINTS, 0, particles.length)
          // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, particles.elements)
          // gl.drawElements(gl.POINTS, particles.length, gl.UNSIGNED_BYTE, 0)
          gl.disableVertexAttribArray(v_id)
          // gl.drawArrays(gl.POINTS, 0, particles.length)

          // if (v_pos >= 0) gl.disableVertexAttribArray(v_pos)
          // if (v_vel >= 0) gl.disableVertexAttribArray(v_vel)
        }

        return {
          draw
        }
      };
    })();

    (function() {
      var prog = gl.createProgram()

      var vs = getShader(require('./shaders/grid-vert.glsl'), gl.VERTEX_SHADER);
      var fs = getShader(require('./shaders/grid-frag.glsl'), gl.FRAGMENT_SHADER);
      addShaders(prog, [vs, fs]);

      var u_grid = gl.getUniformLocation(prog, "u_grid")
      var u_direction = gl.getUniformLocation(prog, "u_direction")
      var u_count = gl.getUniformLocation(prog, "u_count")
      var u_offset = gl.getUniformLocation(prog, "u_offset")
      var u_color = gl.getUniformLocation(prog, "u_color")

      GridPainter = function(grid) {
        function draw(state) {
          gl.useProgram(prog)
        }

        function useX() {
          gl.useProgram(prog)
          gl.uniform3f(u_offset, 0, 0.5, 0.5)
        }

        function useY() {
          gl.useProgram(prog)
          gl.uniform3f(u_offset, 0.5, 0, 0.5)
        }

        function useZ() {
          gl.useProgram(prog)
          gl.uniform3f(u_offset, 0.5, 0.5, 0)
        }
        
        return {
          draw,
          useX,
          useY,
          useZ
        }
      }
    })();
  
  return {
    ParticlePainter,
    GridPainter
  }
}

export default Painters