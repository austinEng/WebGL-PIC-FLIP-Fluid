'use strict'

const TEXTURE = "TEXTURE"
const ARRAY = "ARRAY"

export default function(gl, webgl2Enabled) {

  class ArrayBuf {
    /**
     * Initialize a buffer to the given size or provided data
     * 
     * @param {ArrayBuffer, SharedArrayBuffer, ArrayBufferView} data
     * 
     * @memberOf Buffer
     */
    constructor(data) {
      this.buffer = gl.createBuffer()
      this.hostData = data
      this.length = data.length
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
      gl.bufferData(gl.ARRAY_BUFFER, this.hostData, gl.DYNAMIC_DRAW)
    }

    /**
     * Bind the buffer
     * 
     * @memberOf Buffer
     */
    use() {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    }

    /**
     * Fetch the contents of the buffer and store them in hostData
     * 
     * @memberOf Buffer
     */
    get() {
      this.use()
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, this.hostData)
    }
    
    /**
     * Populate the buffer with data
     * 
     * @param {ArrayBuffer, SharedArrayBuffer, ArrayBufferView} data
     * @param {any} [type=Compute.DYNAMIC]
     * 
     * @memberOf Buffer
     */
    set(data) {
      this.use()
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
    }
  }

  class TextureBuf {
    constructor(data) {
      this.texture = gl.createTexture()
      this.length = data.length

      this.textureLength = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(this.length)))))
      if (webgl2Enabled && false) {
        this.hostData = new data.constructor(this.textureLength * this.textureLength)
        this.hostData.set(data)
      } else {
        this.hostData = new data.constructor(this.textureLength * this.textureLength * 4)
        for (let i = 0; i < this.textureLength * this.textureLength; ++i) {
          this.hostData[4*i] = data[i];
        }
      }
      
      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      if (data instanceof Float32Array && (ext_tex_float || webgl2Enabled)) {
        if (webgl2Enabled) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, this.hostData)
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.FLOAT, this.hostData)
        }
      } else if (data instanceof Uint8Array) {
        if (webgl2Enabled) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.hostData)
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.hostData)
        }
      } else {
        console.error("Array buffer type unsupported")
      }
      

      // if (data instanceof Float32Array) {

      // } else {
      //   console.error("Unsupported data type")
      // }


      // we want this.hostData.byteLength = 4 * powerof2
      /*let pixelsPerElement = data.BYTES_PER_ELEMENT / 4
      let minPixels = pixelsPerElement * data.length
      this.textureLength = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(minPixels)))))

      this.hostData = new data.constructor(this.textureLength * this.textureLength / pixelsPerElement)
      this.hostData.set(data)

      this.bytesPerElement = this.hostData.BYTES_PER_ELEMENT

      this.bufferView = new Uint8Array(this.hostData.buffer)
      this.bufferLength = this.bufferView.byteLength
     
      // console.log(data)
      // console.log(this.hostData)
      // console.log(this.bufferView)

      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureLength, this.textureLength, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.bufferView)*/
    }

    use() {

    }

    get() {

    }

    set(data) {

    }
  }

  const ComputeBuffer = function(data, mode) {
    if (mode == ARRAY) {
      return new ArrayBuf(data)
    } else if (mode == TEXTURE) {
      return new TextureBuf(data)
    } else {
      console.error("Unsupported buffer mode")
    }
  }

  ComputeBuffer.TEXTURE = TEXTURE
  ComputeBuffer.ARRAY = ARRAY

  return ComputeBuffer
}