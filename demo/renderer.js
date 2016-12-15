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

  var camera
  var rendererReady
  var canvas = gl.canvas
  var drawables = []

  function setup() {
    camera = Camera(canvas)
    camera.position.set(3,1,12);
  }
  
  var cameraMat = new THREE.Matrix4();
  function draw() {
    camera.controls.update()

    camera.updateMatrixWorld();
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    
    cameraMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    
    for (let i = 0; i < drawables.length; ++i) {
      drawables[i].draw({
        camera,
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