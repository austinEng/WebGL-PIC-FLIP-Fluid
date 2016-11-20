'use strict'

import {vec3} from 'gl-matrix'

export class Grid {
  constructor(bound, offset, cellSize, ArrType) {
    this.bound = bound
    this.offset = offset
    this.cellSize = cellSize
    this.count = vec3.create()

    vec3.sub(this.count, this.bound._size, offset)
    vec3.scale(this.count, this.count, 1.0 / this.cellSize)
    vec3.add(this.count, this.count, vec3.fromValues(1, 1, 1))
    vec3.floor(this.count, this.count)

    this.contents = new ArrType(this.count[0] * this.count[1] * this.count[2])
  }
}

export default class MACGrid {
  constructor(bound, cellSize) {
    this.bound = bound
    this.cellSize = cellSize

    let cOffset = vec3.fromValues(0.5, 0.5, 0.5)
    let xOffset = vec3.fromValues(0.5, 0.0, 0.5)
    let yOffset = vec3.fromValues(0.0, 0.5, 0.5)
    let zOffset = vec3.fromValues(0.5, 0.5, 0.0)
    vec3.scale(cOffset, cOffset, cellSize)
    vec3.scale(xOffset, xOffset, cellSize)
    vec3.scale(yOffset, yOffset, cellSize)
    vec3.scale(zOffset, zOffset, cellSize)

    this.grid = new Grid(bound, cOffset, cellSize, Int8Array)
    this.gU = new Grid(bound, xOffset, cellSize, Float32Array)
    this.gV = new Grid(bound, yOffset, cellSize, Float32Array)
    this.gW = new Grid(bound, zOffset, cellSize, Float32Array)
    this.gU_old = new Grid(bound, xOffset, cellSize, Float32Array)
    this.gV_old = new Grid(bound, yOffset, cellSize, Float32Array)
    this.gW_old = new Grid(bound, zOffset, cellSize, Float32Array)
    this.gP = new Grid(bound, cOffset, cellSize, Float32Array)
    this.gType = new Grid(bound, cOffset, cellSize, Int8Array)
  }
}