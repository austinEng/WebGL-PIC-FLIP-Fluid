'use strict'

import Stats from 'stats-js'

export default function(shouldUpdate, update) {
  var lastTime = 0;
  var frameRequest;
  var running = false;
  var execStats = new Stats()
  var frameStats = new Stats()
  
  function tick(total) {
    var elapsed = total - lastTime
    frameStats.end()
    lastTime = total;

    execStats.begin()
    update()
    execStats.end()

    if (shouldUpdate()) {
      frameRequest = requestAnimationFrame(tick)
      frameStats.begin()
    } else {
      running = false
    }
  }

  function start() {
    lastTime = 0
    frameStats.begin()
    tick(0)
  }
  
  return {
    tick: function() {
      if (!running) {
        frameStats.begin()
        frameRequest = requestAnimationFrame(tick)
      }
    },
    execStats,
    frameStats
  }
}