'use strict'

module.exports = function(gl) {
  function getShader(source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Could not compile shader!");
      console.error(source);
      console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function addShaders(program, shaders) {
    for (let i = 0; i < shaders.length; ++i) {
      gl.attachShader(program, shaders[i])
    }

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Failed to link program");
    }
  }

  return {
    getShader,
    addShaders
  }
}
