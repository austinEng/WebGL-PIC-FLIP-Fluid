
import _ComputeBuffer from './buffer'
import _ComputeStorage from './storage'
import _Computation from './computation'

export default function(gl) {
  if (!gl) console.error("WebGL not supported!")
  var webgl2Enabled = window.WebGL2RenderingContext && (gl instanceof window.WebGL2RenderingContext)
  if (!webgl2Enabled) {
    console.warn("WebGL 2 not supported. Falling back to WebGL 1")
    if (!gl.getExtension("OES_texture_float")) {
      console.error("Floating point textures not supported!")
    }
  }

  return {
    ComputeBuffer: _ComputeBuffer(gl, webgl2Enabled),
    ComputeStorage: _ComputeStorage(gl, webgl2Enabled),
    Computation: _Computation(gl, webgl2Enabled)
  }
}