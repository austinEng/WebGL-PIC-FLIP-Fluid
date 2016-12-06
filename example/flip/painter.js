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

      ParticlePainter = function(_particles) {
        var particles = _particles
        var painter = {
          drawParticles: true,
          setBuffer: function(_particles) {
            particles = _particles
          }
        } 

        function draw(state) {
          if (!painter.drawParticles) return
          gl.useProgram(prog)
          
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
          gl.uniform1i(u_particles, 0)

          gl.uniform1i(u_texLength, particles.textureLength)

          gl.uniformMatrix4fv(u_viewProj, false, state.cameraMat.elements);
          
          gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
          gl.enableVertexAttribArray(v_id)
          gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)
          gl.drawArrays(gl.POINTS, 0, particles.length)
          gl.disableVertexAttribArray(v_id)
        }

        painter.draw = draw

        return painter
      };
    })();

    (function() {
      var progcube = gl.createProgram()
      var vs = getShader(require('./shaders/grid-point-vert.glsl'), gl.VERTEX_SHADER);
      var fs = getShader(require('./shaders/grid-point-frag.glsl'), gl.FRAGMENT_SHADER);
      addShaders(progcube, [vs, fs]);

      var u_grid2 = gl.getUniformLocation(progcube, "u_grid")
      var u_min2 = gl.getUniformLocation(progcube, "u_min")
      var u_count2 = gl.getUniformLocation(progcube, "u_count")
      var u_cellSize2 = gl.getUniformLocation(progcube, "u_cellSize")
      var u_texLength2 = gl.getUniformLocation(progcube, "u_texLength")
      var u_viewProj2 = gl.getUniformLocation(progcube, "u_viewProj")

      var v_id = gl.getAttribLocation(progcube, "v_id")

      var progline = gl.createProgram()

      vs = getShader(require('./shaders/grid-vert.glsl'), gl.VERTEX_SHADER);
      fs = getShader(require('./shaders/grid-frag.glsl'), gl.FRAGMENT_SHADER);
      addShaders(progline, [vs, fs]);

      var u_grid = gl.getUniformLocation(progline, "u_grid")
      var u_direction = gl.getUniformLocation(progline, "u_direction")
      var u_count = gl.getUniformLocation(progline, "u_count")
      var u_offset = gl.getUniformLocation(progline, "u_offset")
      var u_min = gl.getUniformLocation(progline, "u_min")
      var u_cellSize = gl.getUniformLocation(progline, "u_cellSize")
      var u_texLength = gl.getUniformLocation(progline, "u_texLength")
      var u_g = gl.getUniformLocation(progline, "u_g")
      var u_viewProj = gl.getUniformLocation(progline, "u_viewProj")
      var u_mode = gl.getUniformLocation(progline, "u_mode")

      var v_id = gl.getAttribLocation(progline, "v_id")

      GridPainter = function(_grid) {
        var grid = _grid

        var buf2 = gl.createBuffer()
        var buf1 = gl.createBuffer()
        
        function setup(grid) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buf2)
          let data = new Float32Array(2*grid.count[0]*grid.count[1]*grid.count[2])
          for (let i = 0; i < data.length; ++i) {
            data[i] = i;
          }
          buf2.length = data.length
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
          gl.bindBuffer(gl.ARRAY_BUFFER, null)

          gl.bindBuffer(gl.ARRAY_BUFFER, buf1)
          data = new Float32Array(1*grid.count[0]*grid.count[1]*grid.count[2])
          for (let i = 0; i < data.length; ++i) {
            data[i] = i;
          }
          buf1.length = data.length
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
          gl.bindBuffer(gl.ARRAY_BUFFER, null)
        }

        if (grid) setup(grid)

        function drawX() {
          gl.uniform1i(u_g, 0)
          gl.uniform3f(u_direction, 1, 0, 0)

          gl.drawArrays(gl.LINES, 0, buf2.length)
        }

        function drawY() {
          gl.uniform1i(u_g, 1)
          gl.uniform3f(u_direction, 0, 1, 0)

          gl.drawArrays(gl.LINES, 0, buf2.length)
        }

        function drawZ() {
          gl.uniform1i(u_g, 2)
          gl.uniform3f(u_direction, 0, 0, 1)

          gl.drawArrays(gl.LINES, 0, buf2.length)
        }

        function drawTypes() {
          gl.bindBuffer(gl.ARRAY_BUFFER, buf1)
          gl.enableVertexAttribArray(v_id)
          gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

          gl.drawArrays(gl.POINTS, 0, buf1.length)

          gl.disableVertexAttribArray(v_id)

        }

        var painter = {
          drawTypes: false,
          drawA: false,
          drawMIC: true,
          drawX: false,
          drawY: false,
          drawZ: false,
          setBuffer: function(_grid) {
            grid = _grid
            setup(grid)
          }
        }

        function draw(state) {
          if (painter.drawTypes || painter.drawA || painter.drawMIC) {
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.useProgram(progcube)

            gl.uniform1i(u_grid2, 0)
            gl.uniform1i(u_texLength2, grid.textureLength)
            gl.uniform3fv(u_min2, grid.min)
            gl.uniform3i(u_count2, grid.count[0], grid.count[1], grid.count[2])
            gl.uniform1f(u_cellSize2, grid.cellSize)
            gl.uniformMatrix4fv(u_viewProj2, false, state.cameraMat.elements);

            gl.activeTexture(gl.TEXTURE0)
            if (painter.drawTypes) {
              gl.uniform1i(u_mode, 0)
              gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)

              drawTypes()
            }
            if (painter.drawA) {
              gl.uniform1i(u_mode, 1)
              gl.bindTexture(gl.TEXTURE_2D, grid.P.tex)

              drawTypes()
            }
            if (painter.drawb) {
              gl.uniform1i(u_mode, 1)
              gl.bindTexture(gl.TEXTURE_2D, grid.b.tex)

              drawTypes()
            }
            if (painter.drawMIC) {
              gl.uniform1i(u_mode, 1)
              gl.bindTexture(gl.TEXTURE_2D, grid.MIC1.tex)

              drawTypes()
            }

          }

          if (painter.drawX || painter.drawY || painter.drawZ) {
            gl.useProgram(progline)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
            gl.uniform1i(u_grid, 0)
            gl.uniform1i(u_texLength, grid.textureLength)
            gl.uniform3fv(u_min, grid.min)
            gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
            gl.uniform1f(u_cellSize, grid.cellSize)

            gl.uniformMatrix4fv(u_viewProj, false, state.cameraMat.elements);

            gl.bindBuffer(gl.ARRAY_BUFFER, buf2)
            gl.enableVertexAttribArray(v_id)
            gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)
          }

          if (painter.drawX) drawX()
          if (painter.drawY) drawY()
          if (painter.drawZ) drawZ()

          if (painter.drawX || painter.drawY || painter.drawZ) {
            gl.disableVertexAttribArray(v_id)
            gl.disable(gl.BLEND)
          }
        }
        
        painter.draw = draw

        return painter
      }
    })();
  
  return {
    ParticlePainter,
    GridPainter
  }
}

export default Painters