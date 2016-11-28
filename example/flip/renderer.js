'use strict'

const THREE = require('three')
const OrbitControls = require('three-orbit-controls')(THREE)

function Camera(canvas) {
  var camera = new THREE.PerspectiveCamera( 10, canvas.width / canvas.height, 0.1, 1000 );

  var controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.target.set(0, 0, 0);
  controls.rotateSpeed = 0.3;
  controls.zoomSpeed = 1.0;
  controls.panSpeed = 2.0;

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
    camera.position.set(7,7,7);
  }
  
  var cameraMat = new THREE.Matrix4();
  function draw() {
    camera.controls.update()
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    camera.updateMatrixWorld();
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    
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
    return false
  }

  function add(painter) {
    drawables.push(painter)
  }

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    gl.viewport(0, 0 , canvas.width, canvas.height)
  }

  window.addEventListener('load', e => {
    setup()
    resize()
    rendererReady()
  })

  window.addEventListener('resize', resize)

  return {
    draw,
    isDirty,
    add,
    ready: new Promise((resolve, reject) => {
      rendererReady = resolve
    }),
    get camera() { return camera }
  }
}