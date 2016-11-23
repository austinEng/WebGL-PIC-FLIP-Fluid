'use strict'

import {vec3} from 'gl-matrix'

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
      var u_min = gl.getUniformLocation(prog, "u_min")
      var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
      var u_texLength = gl.getUniformLocation(prog, "u_texLength")
      var u_g = gl.getUniformLocation(prog, "u_g")
      var u_viewProj = gl.getUniformLocation(prog, "u_viewProj")

      var v_id = gl.getAttribLocation(prog, "v_id")

      GridPainter = function(grid) {
        var count = vec3.create()
        var size = vec3.create()
        vec3.sub(size, grid.max, grid.min)

        var buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        let data = new Float32Array(2*grid.count[0]*grid.count[1]*grid.count[2])
        for (let i = 0; i < data.length; ++i) {
          data[i] = i;
        }
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        var halfCell = 0.5*grid.cellSize

        function drawX() {
          gl.uniform1i(u_g, 0)
          gl.uniform3f(u_offset, 0, halfCell, halfCell)
          gl.uniform3f(u_direction, 1, 0, 0)
          
          vec3.set(count, 0, halfCell, halfCell)
          vec3.sub(count, size, count)
          vec3.scale(count, count, 1 / grid.cellSize)
          vec3.ceil(count, count)
          gl.uniform3i(u_count, count[0], count[1], count[2])

          gl.drawArrays(gl.LINES, 0, 2 * count[0] * count[1] * count[2])
        }

        function drawY() {
          gl.uniform1i(u_g, 1)
          gl.uniform3f(u_offset, halfCell, 0, halfCell)
          gl.uniform3f(u_direction, 0, 1, 0)

          vec3.set(count, halfCell, 0, halfCell)
          vec3.sub(count, size, count)
          vec3.scale(count, count, 1 / grid.cellSize)
          vec3.ceil(count, count)
          gl.uniform3i(u_count, count[0], count[1], count[2])

          gl.drawArrays(gl.LINES, 0, 2 * count[0] * count[1] * count[2])
        }

        function drawZ() {
          gl.uniform1i(u_g, 2)
          gl.uniform3f(u_offset, halfCell, halfCell, 0)
          gl.uniform3f(u_direction, 0, 0, 1)

          vec3.set(count, halfCell, halfCell, 0)
          vec3.sub(count, size, count)
          vec3.scale(count, count, 1 / grid.cellSize)
          vec3.ceil(count, count)
          gl.uniform3i(u_count, count[0], count[1], count[2])

          gl.drawArrays(gl.LINES, 0, 2 * count[0] * count[1] * count[2])
        }

        function draw(state) {
          gl.useProgram(prog)

          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
          gl.uniform1i(u_grid, 0)
          gl.uniform1i(u_texLength, grid.textureLength)
          gl.uniform3fv(u_min, grid.min)
          gl.uniform1f(u_cellSize, grid.cellSize)

          gl.uniformMatrix4fv(u_viewProj, false, state.cameraMat.elements);

          gl.bindBuffer(gl.ARRAY_BUFFER, buf)
          gl.enableVertexAttribArray(v_id)
          gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

          drawX()
          drawY()
          drawZ()

          gl.disableVertexAttribArray(v_id)
        }
        
        return {
          draw
        }
      }
    })();
  
  return {
    ParticlePainter,
    GridPainter
  }
}

export default Painters