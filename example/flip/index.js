'use strict'

import _Compute from '../../lib'
import {ParticleBuffer, BoxRegion} from './particles'
import MAC from './grid'
import Bound from './bound'
import Renderer from './renderer'
import Loop from './loop'
import Painters from './painter'

const canvas = document.getElementById("canvas");

const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

const {ParticlePainter} = Painters(gl)

const {ComputeBuffer, Computation} = _Compute(gl)

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

var box = new BoxRegion(10, new Bound({
  minX: -0.5, maxX: 0.5,
  minY: -0.5, maxY: 0.5,
  minZ: -0.5, maxZ: 0.5
}))
console.log(box)
var particles = new ParticleBuffer()
particles.addRegion(box)
particles.create()

var devParticles = new ComputeBuffer(particles.buffer, ComputeBuffer.ARRAY)

var renderer = Renderer(gl);
renderer.add(ParticlePainter(devParticles))

var drawloop = Loop(
  () => {
    return renderer.isDirty()
  },
  () => {
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