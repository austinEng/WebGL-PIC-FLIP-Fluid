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
      var v_pos = gl.getAttribLocation(particleProg, "v_pos")
      var v_vel = gl.getAttribLocation(particleProg, "v_vel")
      var u_viewProj = gl.getUniformLocation(particleProg, "u_viewProj")

      ParticlePainter = function(particles) {

        gl.bindBuffer(gl.ARRAY_BUFFER, particles.buffer)
        gl.vertexAttribPointer(v_pos, 3, gl.FLOAT, false, 32 / 8 * 3, 0)
        gl.vertexAttribPointer(v_vel, 3, gl.FLOAT, false, 32 / 8 * 3, 32 / 8 * 3)

        function draw(state) {
          gl.useProgram(particleProg)
          gl.bindBuffer(gl.ARRAY_BUFFER, particles.buffer)
          
          gl.uniformMatrix4fv(u_viewProj, false, state.cameraMat.elements);

          gl.enableVertexAttribArray(v_pos)
          gl.enableVertexAttribArray(v_vel)
                    
          gl.drawArrays(gl.POINTS, 0, particles.length / 6)

          gl.disableVertexAttribArray(v_pos)
          gl.disableVertexAttribArray(v_vel)
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