'use strict'

import Snippets from './snippets'

export default function(gl) {

  class Computation {
    constructor(params) {
      this.prog = gl.createProgram()
      Object.assign(this, params)
    }

    setup() {
      gl.useProgram(this.prog)
    }

    teardown() {}

    exec() {
      this.setup()
      this.teardown()
    }
  }

  class Scatter extends Computation {
    constructor(params) {
      super(params)

      for (var sourceName in this.sources) {
        // if (this.sources[sourceName] == 'uniform1f') {

        // }

        // this.locations[sourceName] = gl.getUniformLocation(this.prog, sourceName)
      }
    }

    setup() {
      super.setup()
    }
  }

  class Accumulate extends Scatter {
    constructor({ sources, target, mapping, }) {
      super({ sources, target, mapping, })
    }

    setup() {
      super.setup()
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)
    }

    teardown() {
      gl.disable(gl.BLEND)
    }

  }

  class Filter extends Computation {
    constructor() {
      super()
    }

    setup() {
      super.setup()
    }
  }

  class Gather extends Computation {
    constructor() {
      super()
    }

    setup() {
      super.setup()
    }
  }

  return {
    Computation,
    Scatter,
    Accumulate,
    Filter,
    Gather
  }
}