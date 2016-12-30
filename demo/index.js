'use strict'

// import _Compute from '../../lib'
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
gl.webgl2 = (typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext)

if (!gl.webgl2) {
  const ext_tex_float = gl.getExtension("OES_texture_float")
} else {
  const ext_color_buffer_float = gl.getExtension("EXT_color_buffer_float")
}

const {ParticlePainter, GridPainter} = Painters(gl)

const ParticleBuffer = _ParticleBuffer(gl)

const {MACGrid} = _MAC(gl)
const {Sim} = _Sim(gl)


var sim
var renderer = Renderer(gl);
var particlePainter = ParticlePainter(null)
var gridPainter = GridPainter(null)
renderer.add(gridPainter)
renderer.add(particlePainter)

function initialize(settings) { 
  var CELL_SIZE = 2 / Math.cbrt(settings.density) // ~8 particles per cell
  var box = new BoxRegion(4*settings.density, new Bound({
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
  },
  (t) => {
    if (sim.shouldUpdate) {
      sim.step(STEP_SIZE, simulationControls)
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

// drawloop.execStats.setMode(1)
// drawloop.execStats.domElement.style.position = 'absolute';
// drawloop.execStats.domElement.style.left = '0px';
// drawloop.execStats.domElement.style.top = '48px';
// document.body.appendChild(drawloop.execStats.domElement)

renderer.ready.then(() => {
  sim.shouldUpdate = true
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
    sim.step(STEP_SIZE, simulationControls)
    drawloop.start()
  },
  precondition: true,
  ipp: true,
  density: 100000,  // particles per cubic meter
  solverSteps: 100,
  smooth: 5
}

initialize(simulationControls)

var gui = new DAT.GUI();
var fluidSettings = gui.addFolder('Fluid')
fluidSettings.add(simulationControls, 'density')
fluidSettings.add(simulationControls, 'solverSteps', 1, 1000)
fluidSettings.add(simulationControls, 'precondition')
fluidSettings.add(simulationControls, 'ipp')
fluidSettings.add(simulationControls, 'smooth', 0, 100)
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
// display.open()