'use strict'

export default function(gl) {
  return {
    texture: require('./texture').default(gl),
    computation: require(./computation).default(gl)
  }
}