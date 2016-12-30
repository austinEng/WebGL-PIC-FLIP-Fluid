'use strict'

import {vec3} from 'gl-matrix'

export default function (gl) {

  const {setupFramebufferTexture} = require('./util')(gl)

  class MACGrid {
    constructor(bound, cellSize) {
      // this.bound = bound
      this.min = vec3.fromValues(bound.minX, bound.minY, bound.minZ)
      this.max = vec3.fromValues(bound.maxX, bound.maxY, bound.maxZ)
      vec3.set(this.max, 
        this.min[0] + cellSize * Math.ceil((this.max[0] - this.min[0]) / cellSize),
        this.min[1] + cellSize * Math.ceil((this.max[1] - this.min[1]) / cellSize),
        this.min[2] + cellSize * Math.ceil((this.max[2] - this.min[2]) / cellSize))
      this.cellSize = cellSize

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

      this.div = {
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

      setupFramebufferTexture(this.A.tex, this.A.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.B.tex, this.B.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.old.tex, this.old.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.T.tex, this.T.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.P.tex, this.P.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.div.tex, this.div.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.MIC1.tex, this.MIC1.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.MIC2.tex, this.MIC2.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.PCG1.tex, this.PCG1.fbo, this.textureLength, this.textureLength, null)
      setupFramebufferTexture(this.PCG2.tex, this.PCG2.fbo, this.textureLength, this.textureLength, null)

      console.log(this)
    }

    swap() {
      var temp = this.A
      this.A = this.B
      this.B = temp
    }
  }

  return {
    MACGrid
  }
}