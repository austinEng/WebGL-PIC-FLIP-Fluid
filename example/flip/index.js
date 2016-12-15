'use strict'

import _Compute from '../../lib'
import {_ParticleBuffer, BoxRegion} from './particles'
import _MAC from './grid'
import Bound from './bound'
import Renderer from './renderer'
import Loop from './loop'
import Painters from './painter'
import _Sim from './sim'
import DAT from 'dat-gui'

const canvas = document.getElementById("canvas");

const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
const ext_tex_float = gl.getExtension("OES_texture_float")

const {ParticlePainter, GridPainter} = Painters(gl)

const ParticleBuffer = _ParticleBuffer(gl)
const {ComputeBuffer, ComputeStorage, Computation} = _Compute(gl)
const {MACGrid} = _MAC(gl)
const {Sim} = _Sim(gl)

var ParticleStorage = ComputeStorage({
  format: [{
    pos: 3,
  }, {
    vel: 3
  }],
  type: Float32Array,
  dim: 3
})

var particleBufferA = ComputeBuffer({
  storage: ParticleStorage,
  dim: [10, 10, 10],
  data: null
})

var particleBufferB = ComputeBuffer({
  storage: ParticleStorage,
  dim: [10, 10, 10],
  data: null
})

particleBufferA.setData([{
  pos: [1,5,6],
  vel: [0,0,0]
},
{
  pos: [2,1,3],
  vel: [0,0,0]
}])

var gravityUpdate = Computation({
  func: `particlesB[index].vel = particlesA[index].vel - 9.81*t`,
  inputs: {
    particlesA: ParticleStorage,
    t: '1f'
  },
  outputs: {
    particlesB: ParticleStorage
  }
})

gravityUpdate.generate().setup({
  inputs: {
    particlesA: particleBufferA
  },
  outputs: {
    particlesB: particleBufferB
  }
})


var sim
var renderer = Renderer(gl);
var particlePainter = ParticlePainter(null)
var gridPainter = GridPainter(null)
renderer.add(gridPainter)
renderer.add(particlePainter)

function initialize(settings) { 
  var CELL_SIZE = 2 / Math.cbrt(settings.density) // ~8 particles per cell
  var box = new BoxRegion(2*settings.density, new Bound({
    minX: -0.6, maxX: 0.0,
    minY: -0.4, maxY: 0.4,
    minZ: -0.4, maxZ: 0.4
  }))
  var particles = new ParticleBuffer()
  particles.addRegion(box)
  particles.create()

  var grid = new MACGrid(new Bound({
    minX: -0.8, maxX: 0.8,
    minY: -0.5, maxY: 0.5,
    minZ: -0.5, maxZ: 0.5
  }), CELL_SIZE)

  particlePainter.setBuffer(particles)
  gridPainter.setBuffer(grid)

  sim = Sim(grid, particles, settings.solverSteps)
}

var STEP_SIZE = 1 / 60;

var drawloop = Loop(
  () => {
    return sim.shouldUpdate
    // return true//renderer.isDirty()
  },
  (t) => {
    if (sim.shouldUpdate) {
      sim.step(STEP_SIZE, simulationControls.precondition)
    }

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
  // sim.shouldUpdate = true
  drawloop.start()

  renderer.camera.controls.addEventListener('change', e => {
    drawloop.start()
  })

  window.addEventListener('resize', e => {
    drawloop.start()
  })
})

var simulationControls = {
  start: function() {
    sim.shouldUpdate = true
    drawloop.start()
  },
  stop: function() {
    sim.shouldUpdate = false
  },
  restart: function() {
    var running = sim.shouldUpdate
    initialize(simulationControls)
    sim.shouldUpdate = running
    drawloop.start()
  },
  step: function() {
    sim.step(STEP_SIZE, simulationControls.precondition)
    drawloop.start()
  },
  precondition: true,
  density: 150000,  // particles per cubic meter
  solverSteps: 20
}

initialize(simulationControls)

var gui = new DAT.GUI();
var fluidSettings = gui.addFolder('Fluid')
fluidSettings.add(simulationControls, 'density')
fluidSettings.add(simulationControls, 'solverSteps', 1, 1000)
fluidSettings.add(simulationControls, 'precondition')
fluidSettings.open()
var controls = gui.addFolder('Controls')
controls.add(simulationControls, 'start')
controls.add(simulationControls, 'stop')
controls.add(simulationControls, 'restart')
controls.add(simulationControls, 'step')
controls.open()
var display = gui.addFolder('Display')
display.add(particlePainter, 'drawParticles').onChange(drawloop.start)
display.add(particlePainter, 'drawParticleValues').onChange(drawloop.start)
display.add(gridPainter, 'debugValues').onChange(drawloop.start)
display.add(gridPainter, 'drawX').onChange(drawloop.start)
display.add(gridPainter, 'drawY').onChange(drawloop.start)
display.add(gridPainter, 'drawZ').onChange(drawloop.start)
display.add(gridPainter, 'drawTypes').onChange(drawloop.start)
display.add(gridPainter, 'drawA').onChange(drawloop.start)
display.add(gridPainter, 'drawDiv').onChange(drawloop.start)
display.add(gridPainter, 'drawp').onChange(drawloop.start)
display.add(gridPainter, 'drawr').onChange(drawloop.start)
display.add(gridPainter, 'drawz').onChange(drawloop.start)
display.add(gridPainter, 'draws').onChange(drawloop.start)
display.add(gridPainter, 'drawMIC').onChange(drawloop.start)
display.open()

/*
import _CG from './cg'
const CG = _CG(gl)

var result = CG(gl)
  .setup(4)
  .setA([4,-1,-1,0, -1,4,0,-1, -1,0,4,-1, 0,-1,-1,4])
  .setb([1,2,3,4])
console.log(result)
result = result
  .print(result.A)
  .print(result.b)
  .solve()
  .print(result.K1)
  .print(result.K2)
  .print(result.Minv)
  .print(result.x)
console.log(result)
*/