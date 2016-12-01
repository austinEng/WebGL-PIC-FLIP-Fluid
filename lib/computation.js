'use strict'

import _ComputeBuffer from './buffer'
import _ComputeStorage from './storage'

export default function(gl, webgl2Enabled) {
  const ComputeBuffer = _ComputeBuffer(gl, webgl2Enabled)
  const ComputeStorage = _ComputeStorage(gl, webgl2Enabled)

  var fullscreenQuadVBO = (function() {
    var verts = new Float32Array ([
      1.0, 1.0,
      -1.0, 1.0,
      -1.0, -1.0,
      -1.0, -1.0,
      1.0, -1.0,
      1.0, 1.0
    ])

    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
    return buffer
  })()

  var fullScreenVertexShader = (function() {
    var source = `
      precision lowp float;
      attribute vec2 vs_pos;
      void main() {
        gl_Position = vec4(vs_pos, 0.0, 0.1);
      }
    `
    var shader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(source);
      console.error('shader compiler error:\n' + gl.getShaderInfoLog(shader));
    }
    return shader
  })()

  const UV = "UV"
  const POINTS = "POINTS"

  function Computation({func: func, inputs: inputs, outputs: outputs}) {
    // var argc = func.length;

    function setupShader(body, argNames) {
      console.log(argNames)
    }

    for (let name in inputs) {
      if (inputs[name] instanceof ComputeStorage) {
        console.log(name, inputs[name])
        var readRE = new RegExp(`=[\\s\\S]*${name}\\[([\\s\\S]+?)\\]\\.(\\S+?)\\s`, 'g')
        var writeRE = new RegExp(`${name}\\[([\\s\\S]+?)\\]\\.(\\S+?)\\s*=`, 'g')
        
        var readMatch = readRE.exec(func)
        while (readMatch != null) {
          var [_, indexMapping, element] = readMatch
          console.log(indexMapping, element)
          readMatch = readRE.exec(func)
        }

        var writeMatch = writeRE.exec(func)
        while (writeMatch != null) {
          var [_, indexMapping, element] = writeMatch
          console.log(indexMapping, element)
          writeMatch = writeRE.exec(func)
        }
      }
    }

    function glslType(type) {
      if (type instanceof ComputeStorage) return "sampler2D"
      switch(type) {
        case '1f': return 'float'
        case '2f': return 'vec2'
        case '3f': return 'vec3'
        case '4f': return 'vec4'
        case '1i': return 'int'
        case '2i': return 'ivec2'
        case '3i': return 'ivec3'
        case '4i': return 'ivec4'
        case '1b': return 'bool'
        case '2b': return 'bvec2'
        case '3b': return 'bvec3'
        case '4b': return 'bvec4'
      }
    }

    function generate() {
      var uniforms = "";

      for (let name in inputs) {
        if (inputs[name] instanceof ComputeStorage) {
          uniforms += `uniform int ${name}_textureLength;\n`
          uniforms += `uniform ivec${inputs[name].dim()} ${name}_dim;\n`
        }
        uniforms += `uniform ${glslType(inputs[name])} ${name};\n`
      }
      for (let name in outputs) {
        if (outputs[name] instanceof ComputeStorage) {
          uniforms += `uniform int ${name}_textureLength;\n`
          uniforms += `uniform ivec${outputs[name].dim()} ${name}_dim;\n`
        }
      }
      console.log(uniforms)

      return {
        setup: function({inputs: inputs, outputs: outputs}) {
          console.log(inputs)
          console.log(outputs)
        }
      }
    }

    return {
      generate
    }
  }
  
  return Computation
   

  /*class Computation {
    constructor(func) {
      [func, ...this.types] = arguments
      this.argc = func.length
      if (!webgl2Enabled) {
        for (let i in this.types) {
          this.types[i] = ComputeBuffer.TEXTURE
        }
      }
      this.prog = gl.createProgram()
      this.glslHeader = []
      this.parse(func.toString())
      console.log(this)
    }

    parse(str) {
      let parseRE = /\(([\s\S]*)\)\s*{([\s\S]*)}/g
      let [_, argNames, body] = parseRE.exec(str)
      argNames = argNames.split(", ")
      this.setupInput(argNames)
      this.setupBody(body, argNames)
    }

    setupInput(argNames) {
      for (let i in argNames) {
        let name = argNames[i]
        let type = this.types[i]
        if (type == ComputeBuffer.TEXTURE) {
          this.glslHeader.push(`uniform sampler2D ${name};`)
        } else if (type == ComputeBuffer.ARRAY) {
          this.glslHeader.push(`attribute float ${name};`)
        }
      }

      console.log(this.glslHeader.join('\n'))
    }

    setupBody(body, argNames) {
      for (let i in argNames) {
        let name = argNames[i]
        let type = this.types[i]
        
        if (type == ComputeBuffer.TEXTURE) {
          body = body.replace(RegExp(`${name}\[.+?\]`), `texture2D(${name})`)
        }
        console.log(body)
      }
    }

    exec() {

    }
  }

  return Computation*/
}