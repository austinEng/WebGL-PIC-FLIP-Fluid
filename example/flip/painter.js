'use strict'

function Painters(gl) {

  const {getShader, addShaders} = require('./util')(gl);

  var particleProg = gl.createProgram();

  var ParticlePainter;

  (function() {
    var particleVS = getShader(require('./shaders/particle-vert.glsl'), gl.VERTEX_SHADER);
    var particleFS = getShader(require('./shaders/particle-frag.glsl'), gl.FRAGMENT_SHADER);
    addShaders(particleProg, [particleVS, particleFS]);

    (function() {
      // var v_pos = gl.getAttribLocation(particleProg, "v_pos")
      var v_id = gl.getAttribLocation(particleProg, "v_id")
      var u_particles = gl.getUniformLocation(particleProg, "u_particles")
      var u_texLength = gl.getUniformLocation(particleProg, "u_texLength")
      var u_viewProj = gl.getUniformLocation(particleProg, "u_viewProj")

      ParticlePainter = function(particles) {
        function draw(state) {
          gl.useProgram(particleProg)
          
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
  })();
  
  return {
    ParticlePainter
  }
}

export default Painters