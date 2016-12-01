'use strict'

function ComputeBuffer(gl, webgl2Enabled, {storage: storage, dim: dim, write: write, data: data}) {
  var pixelsPerElement = storage.pixelCount()
  var usedPixels = pixelsPerElement * dim.reduce((val, length) => {
    return val * length
  }, 1)

  var textureLength = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(usedPixels)))))

  var tex = gl.createTexture()
  var fbo = gl.createFramebuffer()

  var hostData = new Float32Array(4 * textureLength * textureLength)
  if (data) hostData.set(data)

  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureLength, textureLength, 0, gl.RGBA, gl.FLOAT, data == null ? null : hostData)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  var buffer = Object.create(ComputeBuffer.prototype)
  return Object.assign(buffer, {
    setData: items => {
      for (let i = 0; i < items.length; ++i) {
        hostData.set(storage.create(items[i]), 4 * i * pixelsPerElement)
      }
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureLength, textureLength, 0, gl.RGBA, gl.FLOAT, hostData)
      gl.bindTexture(gl.TEXTURE_2D, null)
    },

    fetch: () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.readPixels(0,0,textureLength,textureLength, gl.RGBA, gl.FLOAT, hostData)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    },

    hostData: () => hostData,
  })
}

ComputeBuffer.prototype.toString = () => "ComputeBuffer"

export default function(gl, webgl2Enabled) {
  return ComputeBuffer.bind(null, gl, webgl2Enabled)
}