'use strict'


export default function(gl) {

    const {getShader, addShaders} = require('../util')(gl)

    var quad_vbo = (function(){
        var buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0
        ]), gl.STATIC_DRAW)
        return buffer
    })()

    var multiply = (function() {
        var prog = gl.createProgram()

        var vs = getShader(require('./shaders/multiply-vert.glsl'), gl.VERTEX_SHADER);
        var fs = getShader(require('./shaders/multiply-frag.glsl'), gl.FRAGMENT_SHADER);
        addShaders(prog, [vs, fs]);

        var u_A = gl.getUniformLocation(prog, "u_A")
        var u_B = gl.getUniformLocation(prog, "u_B")
        var u_Asize = gl.getUniformLocation(prog, "u_Asize")
        var u_Bsize = gl.getUniformLocation(prog, "u_Bsize")
        var u_Csize = gl.getUniformLocation(prog, "u_Csize")
        var u_Atsize = gl.getUniformLocation(prog, "u_Atsize")
        var u_Btsize = gl.getUniformLocation(prog, "u_Btsize")
        var u_Ctsize = gl.getUniformLocation(prog, "u_Ctsize")

        return function(A, B, C) {
            gl.useProgram(prog)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, A.tex)
            gl.uniform1i(u_A, 0)

            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, B.tex)
            gl.uniform1i(u_B, 1)

            gl.uniform2iv(u_Asize, A.size)
            gl.uniform2iv(u_Bsize, B.size)
            gl.uniform2iv(u_Csize, C.size)
            gl.uniform2iv(u_Atsize, A.textureSize)
            gl.uniform2iv(u_Btsize, B.textureSize)
            gl.uniform2iv(u_Ctsize, C.textureSize)

            gl.bindFramebuffer(gl.FRAMEBUFFER, C.fbo)
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            var nMults = A.size[1] * C.size[0] * C.size[1];
            gl.bufferData(gl.ARRAY_BUFFER, nMults, gl.STATIC_DRAW);
            gl.drawArrays(gl.POINTS, 0, nMults)
            
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        }
    })()

    var incompleteCholesky = (function() {
        var prog = gl.createProgram()

        var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
        var fs = getShader(require('./shaders/incomplete-cholesky-frag.glsl'), gl.FRAGMENT_SHADER);
        addShaders(prog, [vs, fs]);

        var v_pos = gl.getAttribLocation(prog, "v_pos")

        var u_A = gl.getUniformLocation(prog, "u_A")
        var u_K  = gl.getUniformLocation(prog, "u_K")
        var u_size = gl.getUniformLocation(prog, "u_size")
        var u_tsize = gl.getUniformLocation(prog, "u_tsize")

        var u_iter = gl.getUniformLocation(prog, "u_iter")
        var u_step = gl.getUniformLocation(prog, "u_step")

        function swap(data, m1, m2) {
            var temp = data[m1]
            data[m1] = data[m2]
            data[m2] = temp
        }

        return function(data) {

            gl.useProgram(prog)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, data.A.tex)
            gl.uniform1i(u_A, 0)
            gl.uniform2i(u_size, data.A.size[0], data.A.size[1])
            gl.uniform2i(u_tsize, data.A.textureSize[0], data.A.textureSize[1])

            gl.uniform1i(u_K, 1)

            gl.viewport(0, 0, data.A.textureSize[0], data.A.textureSize[1])

        
            gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
            gl.enableVertexAttribArray(v_pos)
            gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)

            gl.activeTexture(gl.TEXTURE1)

            // COPY K = A
            gl.bindFramebuffer(gl.FRAMEBUFFER, data.K2.fbo)
            gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)
            gl.uniform1i(u_step, 0)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            swap(data, 'K1', 'K2')

            for (var i = 0; i < data.A.size[0]; ++i) {

                gl.uniform1i(u_iter, i)

                // DIAGONAL ENTRIES = sqrt(self)
                gl.bindFramebuffer(gl.FRAMEBUFFER, data.K2.fbo)
                gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)
                gl.uniform1i(u_step, 1)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                swap(data, 'K1', 'K2')

                // BELOW CURRENT DIAG ENTRY = self / diag
                gl.bindFramebuffer(gl.FRAMEBUFFER, data.K2.fbo)
                gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)
                gl.uniform1i(u_step, 2)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                swap(data, 'K1', 'K2')

                // MODIFY VALUES BELOW AND TO THE RIGHT OF diag
                gl.bindFramebuffer(gl.FRAMEBUFFER, data.K2.fbo)
                gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)
                gl.uniform1i(u_step, 3)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                swap(data, 'K1', 'K2')
            }

            // CLEAR UPPER TRIANGLE
            gl.bindFramebuffer(gl.FRAMEBUFFER, data.K2.fbo)
            gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)
            gl.uniform1i(u_step, 4)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            swap(data, 'K1', 'K2')

            // COMPUTE INVERSE
            
            gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)

            // initialize inv to I - N
            gl.bindFramebuffer(gl.FRAMEBUFFER, data.Kinv.fbo)
            gl.uniform1i(u_step, 5)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            // create N = A / D - I
            gl.bindFramebuffer(gl.FRAMEBUFFER, data.N1.fbo)
            gl.uniform1i(u_step, 6)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            gl.activeTexture(gl.TEXTURE0)
            for (var i = 2; i < data.A.size[0]; ++i) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, data.N2.fbo)
                gl.bindTexture(gl.TEXTURE_2D, data.N1.tex)
                
                gl.uniform1i(u_step, 7)
                gl.uniform1i(u_iter, i);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                swap(data, 'N1', 'N2')

                // add to the running inverse of (I + N)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE)
                gl.bindFramebuffer(gl.FRAMEBUFFER, data.Kinv.fbo)
                gl.bindTexture(gl.TEXTURE_2D, data.N1.tex)
                gl.uniform1i(u_step, 8)
                gl.uniform1i(u_iter, i % 2);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                gl.disable(gl.BLEND)
            }

            // scale everything by Dinv
            gl.bindFramebuffer(gl.FRAMEBUFFER, data.K2.fbo)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, data.Kinv.tex)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)
            gl.uniform1i(u_step, 9)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            swap(data, 'K1', 'K2')
      
            // COMPUTE M-1
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE)
            gl.bindFramebuffer(gl.FRAMEBUFFER, data.Minv.fbo)
            gl.bindTexture(gl.TEXTURE_2D, data.K1.tex)
            gl.uniform1i(u_step, 10)
            for (var i = 0; i < data.A.size[0]; ++i) {
                gl.uniform1i(u_iter, i)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            }
            gl.disable(gl.BLEND)

            gl.disableVertexAttribArray(v_pos)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            
        }
    })()

    function solve(data) {
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.BLEND)
        incompleteCholesky(data)

        return data
    }
    
    function setup(size) {
        console.log(`Creating problem of size ${size}`)
        var squareMatSize = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(size*size)))));
        var columnSize = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(size)))));
        var A = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [squareMatSize, squareMatSize],
            size: [size, size]
        }
        var b = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [columnSize, columnSize],
            size: [size, 1]
        }

        var x = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [columnSize, columnSize],
            size: [size, 1]
        }

        var K1 = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [squareMatSize, squareMatSize],
            size: [size, size]
        }

        var K2 = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [squareMatSize, squareMatSize],
            size: [size, size]
        }

        var Kinv = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [squareMatSize, squareMatSize],
            size: [size, size]
        }

        var N1 = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [squareMatSize, squareMatSize],
            size: [size, size]
        }

        var N2 = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [squareMatSize, squareMatSize],
            size: [size, size]
        }

        var Minv = {
            tex: gl.createTexture(),
            fbo: gl.createFramebuffer(),
            textureSize: [squareMatSize, squareMatSize],
            size: [size, size]
        }

        for (let mat of [A, b, x, K1, K2, Kinv, N1, N2, Minv]) {
            gl.bindTexture(gl.TEXTURE_2D, mat.tex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, mat.textureSize[0], mat.textureSize[1], 0, gl.RGBA, gl.FLOAT, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, mat.fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mat.tex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        }

        var data = {
            A,
            b,
            x,
            K1, K2, // incomplete cholesky ping-pong
            Kinv,
            N1, N2,
            Minv, // precondition matrix
            solve: function() {
                return solve(data)
            },
            setA: function(arr) {
                var buf = new Float32Array(4*A.textureSize[0]*A.textureSize[1])
                for (let i = 0; i < arr.length; ++i) {
                    buf[4*i] = arr[i]
                }
                gl.bindTexture(gl.TEXTURE_2D, A.tex)
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, A.textureSize[0], A.textureSize[1], gl.RGBA, gl.FLOAT, buf)
                gl.bindTexture(gl.TEXTURE_2D, null)
                return data
            },
            setb: function(arr) {
                var buf = new Float32Array(4*b.textureSize[0]*b.textureSize[1])
                for (let i = 0; i < arr.length; ++i) {
                    buf[4*i] = arr[i]
                }
                gl.bindTexture(gl.TEXTURE_2D, b.tex)
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, b.textureSize[0], b.textureSize[1], gl.RGBA, gl.FLOAT, buf)
                gl.bindTexture(gl.TEXTURE_2D, null)
                return data
            },
            print: function(mat) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, mat.fbo)
                var out = new Float32Array(4*mat.textureSize[0]*mat.textureSize[1])
                gl.readPixels(0,0,mat.textureSize[0],mat.textureSize[1],gl.RGBA,gl.FLOAT, out)
                
                for (let j = 0; j < mat.size[1]; ++j) {
                    var out2 = new Float32Array(mat.size[0])
                    for (let i = 0; i < mat.size[0]; ++i) {
                        out2[i] = out[4*(j * mat.size[0] + i)]
                    }
                    console.log(out2)
                }
                console.log("-------------------")
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                return data
            }
        }

        return data
    }

    return function() {
        return {
            setup
        }
    }


}