'use strict'

const ATTRIB_COUNT = 8

function Particle(i, buffer) {
  var particle = {}
  Object.defineProperty(particle, 'px', {
    get: () => buffer[ATTRIB_COUNT * i + 0]
  })
  Object.defineProperty(particle, 'py', {
    get: () => buffer[ATTRIB_COUNT * i + 1]
  })
  Object.defineProperty(particle, 'pz', {
    get: () => buffer[ATTRIB_COUNT * i + 2]
  })
  Object.defineProperty(particle, 'vx', {
    get: () => buffer[ATTRIB_COUNT * i + 4]
  })
  Object.defineProperty(particle, 'vy', {
    get: () => buffer[ATTRIB_COUNT * i + 5]
  })
  Object.defineProperty(particle, 'vz', {
    get: () => buffer[ATTRIB_COUNT * i + 6]
  })

  return particle
}

export function _ParticleBuffer(gl) {
  return function ParticleBuffer() {
    var particles = []

    var particleBuffer
    
    particleBuffer = {
      addRegion: region => {
        region.particleIterator((x, y, z) => {
          particles.push(x)
          particles.push(y)
          particles.push(z)
          particles.push(Math.random()) // filler
          particles.push(0)
          particles.push(0)
          particles.push(0)
          particles.push(0) // filler
        })
      },

      create: () => {
        // particleBuffer.buffer = Float32Array.from(particles)

        var minPixels = particles.length / 3
        particleBuffer.textureLength = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(minPixels)))))

        var ids = new Float32Array(particleBuffer.length);
        particleBuffer.buffer = new Float32Array(4*particleBuffer.textureLength * particleBuffer.textureLength)
        for (let i = 0; i < particles.length; ++i) {
          particleBuffer.buffer[i] = particles[i]
          ids[i] = i
        }

        particleBuffer.A = {
          tex: gl.createTexture(),
          fbo: gl.createFramebuffer()
        }

        particleBuffer.B = {
          tex: gl.createTexture(),
          fbo: gl.createFramebuffer()
        }

        gl.bindTexture(gl.TEXTURE_2D, particleBuffer.A.tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particleBuffer.textureLength, particleBuffer.textureLength, 0, gl.RGBA, gl.FLOAT, particleBuffer.buffer)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, particleBuffer.A.fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particleBuffer.A.tex, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        gl.bindTexture(gl.TEXTURE_2D, particleBuffer.B.tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particleBuffer.textureLength, particleBuffer.textureLength, 0, gl.RGBA, gl.FLOAT, particleBuffer.buffer)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, particleBuffer.B.fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particleBuffer.B.tex, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        particleBuffer.ids = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer.ids)
        gl.bufferData(gl.ARRAY_BUFFER, ids, gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        console.log(`Created ${particles.length / ATTRIB_COUNT} particles`)
      },

      particle: i => {
        return Particle(i, particleBuffer.buffer)
      },

      get length() {
        return particles.length / ATTRIB_COUNT
      },

      swap() {
        particleBuffer.B = [particleBuffer.A, particleBuffer.A = particleBuffer.B][0]
        // var temp = particleBuffer.A
        // particleBuffer.A = particleBuffer.B
        // particleBuffer.B = temp
      },

      buffer: null
    }

    return particleBuffer
  }
}

class ParticleRegion {
  constructor(density) {
    this.density = density
  }
}

export class BoxRegion extends ParticleRegion {
  constructor(density, bound) {
    super(density)
    this.bound = bound
  }

  particleIterator(cb) {
    var length = 1 / Math.cbrt(this.density)
    for (let x = this.bound.minX; x < this.bound.maxX; x += length) {
      for (let y = this.bound.minY; y < this.bound.maxY; y += length) {
        for (let z = this.bound.minZ; z < this.bound.maxZ; z += length) {
          cb(x, y, z)
        }
      }
    }
  }
}