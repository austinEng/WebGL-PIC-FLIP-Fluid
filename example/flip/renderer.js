'use strict'

const THREE = require('three')
const OrbitControls = require('three-orbit-controls')(THREE)

function Camera(canvas) {
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

  var controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.target.set(0, 0, 0);
  controls.rotateSpeed = 0.3;
  controls.zoomSpeed = 1.0;
  controls.panSpeed = 2.0;

  console.log(controls)

  window.addEventListener('resize', e => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, false);

  camera.controls = controls
  return camera
}

export default function Renderer(gl) {

  var camera, webgl2Enabled;
  var rendererReady
  var canvas = gl.canvas
  var drawables = []

  function setup() {
    webgl2Enabled = window.WebGL2RenderingContext && (gl instanceof window.WebGL2RenderingContext)
    if (!webgl2Enabled) console.warn("WebGL 2 not supported. Falling back to WebGL 1")

    camera = Camera(canvas)
    gl.clearColor(0.2, 0.2, 0.2, 1.0)
  }
  
  var cameraMat = new THREE.Matrix4();
  function draw() {
    camera.controls.update()
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    camera.updateMatrixWorld();
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    
    // console.log(camera.matrixWorld.elements)
    cameraMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    
    for (let i = 0; i < drawables.length; ++i) {
      drawables[i].draw({
        cameraMat: cameraMat,
        projMat: camera.projectionMatrix,
        viewMat: camera.matrixWorldInverse,
      })
    }
  }

  function isDirty() {
    return true
  }

  function add(painter) {
    drawables.push(painter)
  }

  function resize() {
    canvas.style.width = window.innerWidth
    canvas.style.height = window.innerHeight
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  window.addEventListener('load', e => {
    resize()
    setup()
    rendererReady()
  })

  window.addEventListener('resize', resize)

  return {
    draw,
    isDirty,
    add,
    ready: new Promise((resolve, reject) => {
      rendererReady = resolve
    })    
  }
}