'use strict'

function ComputeStorage(gl, webgl2Enabled, {format: format, type: type, dim: dim}) {
  if (type != Float32Array) console.error("Only Float32Array supported!")
  
  var storage = Object.create(ComputeStorage.prototype)

  var pixelCount = format.length

  var internalFormat = {}

  for (let item = 0; item < format.length; ++item) {
    let count = Object.keys(format[item]).reduce((val, key) => {
      return val + format[item][key]
    }, 0)

    let start = 0
    for (let key in format[item]) {
      internalFormat[key] = {
        start,
        pixel: item,
        size: format[item][key]
      }
      start += internalFormat[key].size
    }

    if (count > 4) {
      console.error("Cannot have more than 4 values per pixel!")
    }
  }

  function create(params) {
    var arr = new type(4*pixelCount)
    for (let param in params) {
      if (params[param] instanceof Array) {
        for (let i = 0; i < params[param].length; ++i) {
          arr[internalFormat[param].pixel * 4 + internalFormat[param].start + i] = params[param][i]
        }
      } else if (typeof params[param] === "number") {
        arr[internalFormat[param].pixel * 4 + internalFormat[param].start] = params[param]
      }
    }
    return arr
  }
  

  return Object.assign(storage, {
    create,
    pixelCount: () => pixelCount,
    dim: () => dim
  })
}

ComputeStorage.prototype.toString = () => "ComputeStorage"

export default function(gl, webgl2Enabled) {
  return ComputeStorage.bind(null, gl, webgl2Enabled)
}