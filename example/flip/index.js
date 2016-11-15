
import _Compute from '../../lib'

const canvas = document.getElementById("canvas");
const {ComputeBuffer, Computation} = _Compute(canvas)

var bufA = ComputeBuffer(new Float32Array([1,2,3,4,5]), ComputeBuffer.ARRAY)
var bufB = ComputeBuffer(new Float32Array([2,2,2,3,3]), ComputeBuffer.ARRAY)

function incr(A, B) {
  A[i] = A[i] + B[i]
}

new Computation(incr, ComputeBuffer.ARRAY, ComputeBuffer.ARRAY)
// buf.hostData = new Float32Array([0,0,0,0,0]);
// buf.get()
// console.log(buf.hostData)