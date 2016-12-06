'use strict'

import {vec3} from 'gl-matrix'
import _Compute from '../../lib'

export default function (gl) {
  const {ComputeBuffer} = _Compute(gl)

  class Grid {
    constructor(bound, offset, cellSize, ArrType) {
      this.bound = bound
      this.offset = offset
      this.cellSize = cellSize
      this.count = vec3.create()

      vec3.sub(this.count, this.bound._size, offset)
      vec3.scale(this.count, this.count, 1.0 / this.cellSize)
      vec3.add(this.count, this.count, vec3.fromValues(1, 1, 1))
      vec3.floor(this.count, this.count)

      var _buffer = new ArrType(this.count[0] * this.count[1] * this.count[2])
      this.buffer = new ComputeBuffer(_buffer, ComputeBuffer.TEXTURE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      
      this.fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.buffer.texture, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
  }

  class MACGrid {
    constructor(bound, cellSize) {
      // this.bound = bound
      this.min = vec3.fromValues(bound.minX, bound.minY, bound.minZ)
      this.max = vec3.fromValues(bound.maxX, bound.maxY, bound.maxZ)
      this.cellSize = cellSize

      // let cOffset = vec3.fromValues(0.5, 0.5, 0.5)
      // let xOffset = vec3.fromValues(0.5, 0.0, 0.5)
      // let yOffset = vec3.fromValues(0.0, 0.5, 0.5)
      // let zOffset = vec3.fromValues(0.5, 0.5, 0.0)
      // vec3.scale(cOffset, cOffset, cellSize)
      // vec3.scale(xOffset, xOffset, cellSize)
      // vec3.scale(yOffset, yOffset, cellSize)
      // vec3.scale(zOffset, zOffset, cellSize)

      // this.grid = new Grid(bound, cOffset, cellSize, Uint8Array)
      // this.gU = new Grid(bound, xOffset, cellSize, Float32Array)
      // this.gV = new Grid(bound, yOffset, cellSize, Float32Array)
      // this.gW = new Grid(bound, zOffset, cellSize, Float32Array)
      // this.gU_old = new Grid(bound, xOffset, cellSize, Float32Array)
      // this.gV_old = new Grid(bound, yOffset, cellSize, Float32Array)
      // this.gW_old = new Grid(bound, zOffset, cellSize, Float32Array)
      // this.gP = new Grid(bound, cOffset, cellSize, Float32Array)
      // this.gType = new Grid(bound, cOffset, cellSize, Uint8Array)
      
      // A: U,V,W,P
      // B: U,V,W,Type (old)

      this.count = vec3.create();
      vec3.scale(this.count, bound._size, 1.0 / this.cellSize)
      vec3.add(this.count, this.count, vec3.fromValues(1, 1, 1))
      vec3.floor(this.count, this.count)
      let minPixels = this.count[0] * this.count[1] * this.count[2]
      this.textureLength = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(minPixels)))))

      this.A = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.B = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.old = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }
      
      this.T = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.P = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.MIC1 = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.MIC2 = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.PCG1 = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.PCG2 = {
        tex: gl.createTexture(),
        fbo: gl.createFramebuffer()
      }

      this.Type = {
        tex: this.B.tex,
        fbo: this.B.fbo
      }

      gl.bindTexture(gl.TEXTURE_2D, this.A.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.A.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.A.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      gl.bindTexture(gl.TEXTURE_2D, this.B.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.B.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.B.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      gl.bindTexture(gl.TEXTURE_2D, this.old.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.old.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.old.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      gl.bindTexture(gl.TEXTURE_2D, this.T.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.T.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.T.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      
      gl.bindTexture(gl.TEXTURE_2D, this.P.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.P.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.P.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      gl.bindTexture(gl.TEXTURE_2D, this.MIC1.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.MIC1.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.MIC1.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      gl.bindTexture(gl.TEXTURE_2D, this.MIC2.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.MIC2.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.MIC2.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      gl.bindTexture(gl.TEXTURE_2D, this.PCG1.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.PCG1.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.PCG1.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      gl.bindTexture(gl.TEXTURE_2D, this.PCG2.tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.PCG2.fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.PCG2.tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      console.log(this)
    }

    swap() {
      var temp = this.A
      this.A = this.B
      this.B = temp
    }
  }

  return {
    Grid,
    MACGrid
  }
}