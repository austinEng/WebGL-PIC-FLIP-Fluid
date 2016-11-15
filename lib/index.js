
import _ComputeBuffer from './buffer'
import _Computation from './computation'

export default function(canvas) {
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  if (!gl) console.error("WebGL not supported!")
  let webgl2Enabled = window.WebGL2RenderingContext && (gl instanceof window.WebGL2RenderingContext)
  if (!webgl2Enabled) console.warn("WebGL 2 not supported. Falling back to WebGL 1")
  console.log(gl)

  return {
    ComputeBuffer: _ComputeBuffer(gl, webgl2Enabled),
    Computation: _Computation(gl, webgl2Enabled)
  }
}