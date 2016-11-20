'use strict'

const ATTRIB_COUNT = 6

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
    get: () => buffer[ATTRIB_COUNT * i + 3]
  })
  Object.defineProperty(particle, 'vy', {
    get: () => buffer[ATTRIB_COUNT * i + 4]
  })
  Object.defineProperty(particle, 'vz', {
    get: () => buffer[ATTRIB_COUNT * i + 5]
  })

  return particle
}

export function ParticleBuffer() {
  var particles = []

  var particleBuffer
  
  particleBuffer = {
    addRegion: region => {
      region.particleIterator((x, y, z) => {
        particles.push(x)
        particles.push(y)
        particles.push(z)
        particles.push(1)
        particles.push(1)
        particles.push(1)
      })
    },

    create: () => {
      particleBuffer.buffer = Float32Array.from(particles)
    },

    particle: i => {
      return Particle(i, particleBuffer.buffer)
    },

    get length() {
      return particleBuffer.buffer.length / ATTRIB_COUNT
    },

    buffer: null
  }

  return particleBuffer
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
    for (let x = this.bound.minX; x < this.bound.maxX; x += 1 / this.density) {
      for (let y = this.bound.minY; y < this.bound.maxY; y += 1 / this.density) {
        for (let z = this.bound.minZ; z < this.bound.maxZ; z += 1 / this.density) {
          cb(x, y, z)
        }
      }
    }
  }
}