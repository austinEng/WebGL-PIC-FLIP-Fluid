'use strict'

import {vec3} from 'gl-matrix'

export default class Bound {
  constructor(bounds) {
    this.minX = bounds.minX
    this.maxX = bounds.maxX
    this.minY = bounds.minY
    this.maxY = bounds.maxY
    this.minZ = bounds.minZ
    this.maxZ = bounds.maxZ
    this._size = vec3.fromValues(this.maxX - this.minX, this.maxY - this.minY, this.maxZ - this.minZ)
  }

  size() {
    vec3.set(this._size, this.maxX - this.minX, this.maxY - this.minY, this.maxZ - this.minZ)
    return this._size
  }
}