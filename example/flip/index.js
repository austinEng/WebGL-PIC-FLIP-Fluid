'use strict'

import _Compute from '../../lib'
import {_ParticleBuffer, BoxRegion} from './particles'
import _MAC from './grid'
import Bound from './bound'
import Renderer from './renderer'
import Loop from './loop'
import Painters from './painter'
import _Sim from './sim'

const canvas = document.getElementById("canvas");

const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
const ext_tex_float = gl.getExtension("OES_texture_float")

const {ParticlePainter, GridPainter} = Painters(gl)

const ParticleBuffer = _ParticleBuffer(gl)
const {ComputeBuffer, Computation} = _Compute(gl)
const {MACGrid} = _MAC(gl)
const {Sim} = _Sim(gl)

/*var bufA = ComputeBuffer(new Float32Array([1,2,3,4,5]), ComputeBuffer.ARRAY)
var bufB = ComputeBuffer(new Float32Array([2,2,2,3,3]), ComputeBuffer.ARRAY)
var bufC = ComputeBuffer(new Float32Array([1,2,3,4,5]), ComputeBuffer.TEXTURE)
var bufD = ComputeBuffer(new Float32Array([2,2,2,3,3]), ComputeBuffer.TEXTURE)

function incr(A, B) {
  A[i] = A[i] + B[i]
}

var c1 = new Computation(incr, ComputeBuffer.ARRAY, ComputeBuffer.ARRAY)
var c2 = new Computation(incr, ComputeBuffer.TEXTURE, ComputeBuffer.TEXTURE)*/

// var Grid = new MAC(new Bound(-1, 1, -1, 1, -1, 1), 0.1)
// console.log(Grid)

var DENSITY = 100*100*100 // particles per cubic meter
var CELL_SIZE = 2 / Math.cbrt(DENSITY) // ~8 particles per cell

var box = new BoxRegion(DENSITY, new Bound({
  minX: -0.1, maxX: 0.1,
  minY: 0.3, maxY: 0.5,
  minZ: -0.1, maxZ: 0.1
}))
var particles = new ParticleBuffer()
particles.addRegion(box)
particles.create()

var grid = new MACGrid(new Bound({
  minX: -0.5, maxX: 0.5,
  minY: -0.5, maxY: 0.6,
  minZ: -0.5, maxZ: 0.5
}), CELL_SIZE)

var sim = Sim(grid, particles)

var renderer = Renderer(gl);
renderer.add(ParticlePainter(particles))
renderer.add(GridPainter(grid))

var drawloop = Loop(
  () => {
    return true//renderer.isDirty()
  },
  (t) => {
    sim.step(10 / 60)
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    // gl.enable(gl.DEPTH_TEST)
    // gl.disable(gl.BLEND)
    // gl.clearColor(0.2, 0.2, 0.2, 1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    renderer.draw()
  }  
)

drawloop.frameStats.setMode(1)
drawloop.frameStats.domElement.style.position = 'absolute';
drawloop.frameStats.domElement.style.left = '0px';
drawloop.frameStats.domElement.style.top = '0px';
document.body.appendChild(drawloop.frameStats.domElement)

drawloop.execStats.setMode(1)
drawloop.execStats.domElement.style.position = 'absolute';
drawloop.execStats.domElement.style.left = '0px';
drawloop.execStats.domElement.style.top = '48px';
document.body.appendChild(drawloop.execStats.domElement)

renderer.ready.then(() => {
  drawloop.start()

  renderer.camera.controls.addEventListener('change', e => {
    drawloop.start()
  })

  window.addEventListener('resize', e => {
    drawloop.start()
  })
})