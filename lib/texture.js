'use strict'

export default function(gl) {

  class TextureStorage {
    constructor(format) {
      this.pixels = format.length
      this.internalFormat = {}
      for (var i = 0; i < format.length; ++i) {
        var offset = 0
        for (var name in format[i]) {
          this.internalFormat[name] = {
            size: format[i].size,
            offset,
            pixel: i 
          }
          offset += format[i].size
        }
      }
    }
  }

  class ComputeTexture {
    constructor(dim, pingpong) {

      if (dim.length > 3) {
        return console.error("Maximum dimension 3!")
      }

      var size = dim.reduce((a, b) => a * b, 1)

      if (pingpong) {
        var A = createComputeTexture(dim, false)
        var B = createComputeTexture(dim, false)

        var obj = {
          get tex() {
            return A.tex
          },
          get fbo() {
            return B.fbo
          },
          get size() {
            return A.size
          },
          get texLength() {
            return A.texLength
          },
          swap: function() {
            var temp = A
            A = B
            B = temp
          }
        }

        return obj

      } else {
        var arr = {
          tex: gl.createTexture(),
          fbo: gl.createFramebuffer(),
          size,
          dim,
          texLength: Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(size)))))
        }

        gl.bindTexture(gl.TEXTURE_2D, arr.tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, arr.texLength, arr.texLength, 0, gl.RGBA, gl.FLOAT, null)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, arr.fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, arr.tex, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        return arr
      }
    }
  }

  return {
    ComputeTexture
  }
}