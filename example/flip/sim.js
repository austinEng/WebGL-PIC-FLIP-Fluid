'use strict'

import {vec3} from 'gl-matrix'

export default function (gl) {
    const {getShader, addShaders} = require('./util')(gl)

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

    function Sim (grid, particles, solverSteps) {

        var clearGridVelocity = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/clearVel-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var v_pos = gl.getAttribLocation(prog, "v_pos")

            return function() {
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.A.fbo)
                gl.clear(gl.COLOR_BUFFER_BIT)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.clear(gl.COLOR_BUFFER_BIT)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.old.fbo)
                gl.clear(gl.COLOR_BUFFER_BIT)
            }
        })()

        var projectToGrid = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/project-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/project-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_offset = gl.getUniformLocation(prog, "u_offset")
            var u_count = gl.getUniformLocation(prog, "u_count")
            var u_goffset = gl.getUniformLocation(prog, "u_goffset")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
            var u_texLength = gl.getUniformLocation(prog, "u_texLength")
            var u_g = gl.getUniformLocation(prog, "u_g")
            var u_weights = gl.getUniformLocation(prog, "u_weights")

            var v_id = gl.getAttribLocation(prog, "v_id")
            var u_particles = gl.getUniformLocation(prog, "u_particles")
            var u_particleTexLength = gl.getUniformLocation(prog, "u_particleTexLength")


            var progAvg = gl.createProgram()
            
            var vsAvg = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fsAvg = getShader(require('./shaders/project-avg-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(progAvg, [vsAvg, fsAvg]);

            var v_pos = gl.getAttribLocation(progAvg, "v_pos")
            var gU_old = gl.getUniformLocation(progAvg, "gU_old")
            var u_counts = gl.getUniformLocation(progAvg, "u_counts")

            var counts = {
                tex: gl.createTexture(),
                fbo: gl.createFramebuffer()
            }

            gl.bindTexture(gl.TEXTURE_2D, counts.tex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, grid.textureLength, grid.textureLength, 0, gl.RGBA, gl.FLOAT, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, counts.fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, counts.tex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)

            return function() {

                gl.bindFramebuffer(gl.FRAMEBUFFER, counts.fbo)
                gl.clear(gl.COLOR_BUFFER_BIT)

                gl.useProgram(prog)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

                gl.uniform1i(u_particleTexLength, particles.textureLength)
                
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
                gl.uniform1f(u_cellSize, grid.cellSize)
                gl.uniform1i(u_texLength, grid.textureLength)

                gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE)
                gl.uniform1i(u_weights, 0)
                for (let g = 0; g < 3; ++g) {
                    gl.uniform1i(u_g, g);
                    var r = 1;
                    for (let i = -r; i <= r; ++i) {
                        for (let j = -r; j <= r; ++j) {
                            for (let k = -r; k <= r; ++k) {
                                gl.uniform3i(u_goffset, i,j,k);
                                gl.drawArrays(gl.POINTS, 0, particles.length)
                            }
                        }   
                    }
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, counts.fbo)
                gl.uniform1i(u_weights, 1)
                for (let g = 0; g < 3; ++g) {
                    gl.uniform1i(u_g, g);
                    var r = 1;
                    for (let i = -r; i <= r; ++i) {
                        for (let j = -r; j <= r; ++j) {
                            for (let k = -r; k <= r; ++k) {
                                gl.uniform3i(u_goffset, i,j,k);
                                gl.drawArrays(gl.POINTS, 0, particles.length)
                            }
                        }   
                    }
                }

                gl.disable(gl.BLEND)

                gl.disableVertexAttribArray(v_id)

                grid.swap()

                gl.useProgram(progAvg)
                
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(gU_old, 0)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, counts.tex)
                gl.uniform1i(u_counts, 1)

                gl.enableVertexAttribArray(v_pos)

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                
                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                gl.disableVertexAttribArray(v_pos)

                grid.swap()

                
            }
        })()

        var copyGrid = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/copy-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var v_pos = gl.getAttribLocation(prog, "v_pos")
            var u_grid = gl.getUniformLocation(prog, "u_grid")

            return function() {
                gl.useProgram(prog)
                
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(u_grid, 0)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.old.fbo)
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                gl.disableVertexAttribArray(v_pos)
            }
        })()

        var gravityUpdate = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/gravity-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var v_pos = gl.getAttribLocation(prog, "v_pos")
            var gU_old = gl.getUniformLocation(prog, "gU_old")
            var u_t = gl.getUniformLocation(prog, "u_t")

            var u_types = gl.getUniformLocation(prog, "u_types")
            var u_texLength = gl.getUniformLocation(prog, "u_texLength")
            var u_count = gl.getUniformLocation(prog, "u_count")

            return function(t) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.useProgram(prog)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(gU_old, 0)
                gl.uniform1f(u_t, t)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                gl.uniform1i(u_types, 1)

                gl.uniform1i(u_texLength, grid.textureLength)
                gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                gl.disableVertexAttribArray(v_pos)

                grid.swap()
            }
        })()

        var markCells = (function() {
            var prog = gl.createProgram()
            
            var vs = getShader(require('./shaders/mark-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/mark-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_count = gl.getUniformLocation(prog, "u_count")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
            var u_texLength = gl.getUniformLocation(prog, "u_texLength")
            var u_near = gl.getUniformLocation(prog, "u_near")

            var u_particles = gl.getUniformLocation(prog, "u_particles")
            var u_particleTexLength = gl.getUniformLocation(prog, "u_particleTexLength")

            var v_id = gl.getAttribLocation(prog, "v_id")


            var prog2 = gl.createProgram()

            var vs2 = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs2 = getShader(require('./shaders/mark-edge-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog2, [vs2, fs2]);

            var v_pos = gl.getAttribLocation(prog2, "v_pos")
            var u_texLength2 = gl.getUniformLocation(prog2, "u_texLength")
            var u_count2 = gl.getUniformLocation(prog2, "u_count")
            var u_cellSize2 = gl.getUniformLocation(prog2, "u_cellSize")

            var pointCount = 6 * particles.length
            var pointBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
            var data = new Float32Array(pointCount)
            for (var i = 0; i < pointCount; ++i) { data[i] = i }
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            
            return function() {
                gl.useProgram(prog)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.T.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                gl.clear(gl.COLOR_BUFFER_BIT)
                
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

                gl.uniform1i(u_texLength, grid.textureLength)
                gl.uniform1i(u_particleTexLength, particles.textureLength)
                gl.uniform1f(u_cellSize, grid.cellSize)
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.uniform1i(u_near, 1)
                gl.drawArrays(gl.POINTS, 0, pointCount)
                gl.uniform1i(u_near, 0)
                gl.drawArrays(gl.POINTS, 0, particles.length)

                gl.disableVertexAttribArray(v_id)


                gl.useProgram(prog2)
                
                gl.uniform1i(u_texLength2, grid.textureLength)
                gl.uniform3i(u_count2, grid.count[0], grid.count[1], grid.count[2])
                gl.uniform1f(u_cellSize2, grid.cellSize)

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                gl.disableVertexAttribArray(v_pos)
            }
        })()

        var enforceBoundary = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/boundary-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var v_pos = gl.getAttribLocation(prog, "v_pos")
            var u_texLength = gl.getUniformLocation(prog, "u_texLength")
            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_max = gl.getUniformLocation(prog, "u_max")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
            var u_grid = gl.getUniformLocation(prog, "u_grid")
            var u_types = gl.getUniformLocation(prog, "u_types")
            var u_count = gl.getUniformLocation(prog, "u_count")

            return function() {
                gl.useProgram(prog)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(u_grid, 0)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                gl.uniform1i(u_types, 1)

                gl.uniform1i(u_texLength, grid.textureLength)
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3fv(u_max, grid.max)
                gl.uniform1f(u_cellSize, grid.cellSize)
                gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                gl.disableVertexAttribArray(v_pos)

                grid.swap()
            }
        })()

        var pressureSolve = (function() {

            var tempTex = {
                tex: gl.createTexture(),
                fbo: gl.createFramebuffer()
            }

            var tempTex2 = {
                tex: gl.createTexture(),
                fbo: gl.createFramebuffer()
            }

            gl.bindTexture(gl.TEXTURE_2D, tempTex.tex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex.fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tempTex.tex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)

            gl.bindTexture(gl.TEXTURE_2D, tempTex2.tex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex2.fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tempTex2.tex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)

            var q1 = {
                tex: gl.createTexture(),
                fbo: gl.createFramebuffer()
            }

            var q2 = {
                tex: gl.createTexture(),
                fbo: gl.createFramebuffer()
            }

            gl.bindTexture(gl.TEXTURE_2D, q1.tex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, grid.textureLength, grid.textureLength, 0, gl.RGBA, gl.FLOAT, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, q1.fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, q1.tex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)

            gl.bindTexture(gl.TEXTURE_2D, q2.tex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, grid.textureLength, grid.textureLength, 0, gl.RGBA, gl.FLOAT, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, q2.fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, q2.tex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)

            var alpha;
            var beta;

            var clearMatrices = (function() {
                return function() {
                    gl.clearColor(0,0,0,0)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.P.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.div.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.MIC1.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.MIC2.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG2.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex2.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, q1.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, q2.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                }
            })()

            var buildA = (function() {
                var prog = gl.createProgram()

                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-buildA-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")

                var v_pos = gl.getAttribLocation(prog, "v_pos")

                return function() {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 0)
                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.P.fbo)
                    gl.clearColor(0,0,0,0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)

                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    gl.disableVertexAttribArray(v_pos)
                }
            })()

            var setupA = (function() {
                var prog = gl.createProgram()
                
                var vs = getShader(require('./shaders/pressure-setupA-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/set-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_scale = gl.getUniformLocation(prog, "u_scale")
                var v_id = gl.getAttribLocation(prog, "v_id")

                var pointCount = 6*grid.count[0]*grid.count[1]*grid.count[2]
                var pointBuffer = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                var data = new Float32Array(pointCount)
                for (var i = 0; i < pointCount; ++i) { data[i] = i }
                gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, null)

                return function(t) {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 0)
                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
                    // gl.uniform1f(u_scale, 1.0 / (1*grid.cellSize*grid.cellSize))
                    gl.uniform1f(u_scale, 1.0)
                    // gl.uniform1f(u_scale, 1.0 / (1*grid.cellSize*grid.cellSize))

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.P.fbo)
                    gl.clearColor(0,0,0,0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                    gl.enable(gl.BLEND)
                    gl.blendFunc(gl.ONE, gl.ONE)
                    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                    gl.enableVertexAttribArray(v_id)
                    gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)
                    gl.drawArrays(gl.POINTS, 0, pointCount)
                    gl.disableVertexAttribArray(v_id)
                    gl.bindBuffer(gl.ARRAY_BUFFER, null)
                    gl.disable(gl.BLEND)
                }
            })()

            var setupb = (function() {
                var prog = gl.createProgram()

                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-setupb-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);
                
                var v_pos = gl.getAttribLocation(prog, "v_pos")
                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_A = gl.getUniformLocation(prog, "u_A")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_scale = gl.getUniformLocation(prog, "u_scale")


                return function() {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 0)
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                    gl.uniform1i(u_A, 1)
                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
                    gl.uniform1f(u_scale, 1.0 / grid.cellSize)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    gl.clearColor(0,0,0,0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)

                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.div.fbo)

                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    gl.disableVertexAttribArray(v_pos)

                }
            })()

            var precondition = (function() {
                var prog = gl.createProgram();
                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-precondition-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs])
                
                var v_pos = gl.getAttribLocation(prog, "v_pos")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_A = gl.getUniformLocation(prog, "u_A")
                var u_Pre = gl.getUniformLocation(prog, "u_Pre")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_iter = gl.getUniformLocation(prog, "u_iter")

                return function() {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.P.tex)
                    gl.uniform1i(u_A, 0)
                    gl.activeTexture(gl.TEXTURE2)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 2)
                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
                    
                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.MIC1.fbo)
                    gl.clearColor(0,0,0,0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)

                    var N = Math.max(Math.max(grid.count[0], grid.count[1]), grid.count[2]);
                    gl.activeTexture(gl.TEXTURE1)
                    gl.uniform1i(u_Pre, 1)
                    for (var i = 0; i < N; ++i) {
                        var temp = grid.MIC1
                        grid.MIC1 = grid.MIC2
                        grid.MIC2 = temp

                        gl.bindFramebuffer(gl.FRAMEBUFFER, grid.MIC1.fbo)
                        gl.bindTexture(gl.TEXTURE_2D, grid.MIC2.tex)
                        gl.uniform1i(u_iter, i)
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    }
                    
                    gl.disableVertexAttribArray(v_pos)

                }
            })()

            var preconditionZ = (function() {
                
                var prog = gl.createProgram();
                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-preconditionz-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs])

                var v_pos = gl.getAttribLocation(prog, "v_pos")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_A = gl.getUniformLocation(prog, "u_A")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_pre = gl.getUniformLocation(prog, "u_pre")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_q = gl.getUniformLocation(prog, "u_q")
                var u_setS = gl.getUniformLocation(prog, "u_setS")
                var u_iter = gl.getUniformLocation(prog, "u_iter")
                var u_step = gl.getUniformLocation(prog, "u_step")

                return function(setS) {

                    gl.bindFramebuffer(gl.FRAMEBUFFER, q1.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, q2.fbo)
                    gl.clear(gl.COLOR_BUFFER_BIT)

                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.P.tex)
                    gl.uniform1i(u_A, 0)
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, grid.MIC1.tex)
                    gl.uniform1i(u_pre, 1)
                    gl.activeTexture(gl.TEXTURE3)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 3)
                    gl.uniform1i(u_setS, setS)

                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                    var temp

                    var N = Math.max(Math.max(grid.count[0], grid.count[1]), grid.count[2]);
                    gl.activeTexture(gl.TEXTURE2)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG1.tex)
                    gl.uniform1i(u_pcg, 2)

                    gl.uniform1i(u_step, 0)
                    gl.activeTexture(gl.TEXTURE4)
                    gl.uniform1i(u_q, 4)
                    for (var i = 0; i < N; ++i) {
                        temp = q1
                        q1 = q2
                        q2 = temp

                        gl.bindFramebuffer(gl.FRAMEBUFFER, q1.fbo)
                        gl.bindTexture(gl.TEXTURE_2D, q2.tex)
                        gl.uniform1i(u_iter, i)
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                        // var buf = new Float32Array(grid.textureLength*grid.textureLength*4)
                        // gl.readPixels(0,0,grid.textureLength, grid.textureLength, gl.RGBA, gl.FLOAT, buf)
                        // buf = buf.filter(val => val != 0);
                        // console.log(i, buf)
                        
                    }

                    gl.bindTexture(gl.TEXTURE_2D, q1.tex)

                    gl.uniform1i(u_step, 1)
                    gl.activeTexture(gl.TEXTURE2)
                    for (var i = N-1; i >= 0; --i) {
                        temp = grid.PCG1
                        grid.PCG1 = grid.PCG2
                        grid.PCG2 = temp

                        gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                        gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                        gl.uniform1i(u_iter, i)
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                        // var buf = new Float32Array(grid.textureLength*grid.textureLength*4)
                        // gl.readPixels(0,0,grid.textureLength, grid.textureLength, gl.RGBA, gl.FLOAT, buf)
                        // buf = buf.filter((val, idx) => val > 0 && idx - 4*Math.floor(idx / 4) == 2);
                        // console.log(i, buf)
                    }

                    gl.disableVertexAttribArray(v_pos)
                }
            })()

            var computeSigma = (function() {
                var prog = gl.createProgram()
                
                var vs = getShader(require('./shaders/pressure-sigma-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/set-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_preconditioned = gl.getUniformLocation(prog, "u_preconditioned")

                var v_id = gl.getAttribLocation(prog, "v_id")

                var pointCount = grid.count[0]*grid.count[1]*grid.count[2]
                var pointBuffer = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                var data = new Float32Array(pointCount)
                for (var i = 0; i < pointCount; ++i) { data[i] = i }
                gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, null)

                return function(useNew, isPreconditioned) {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG1.tex)
                    gl.uniform1i(u_pcg, 0);
                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.uniform1i(u_preconditioned, isPreconditioned)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex.fbo)
                    gl.enable(gl.SCISSOR_TEST)
                    if (useNew) {
                        gl.viewport(0,1,1,1)
                        gl.scissor(0,1,1,1)
                    } else {
                        gl.viewport(0,0,1,1)
                        gl.scissor(0,0,1,1)
                    }
                    
                    gl.clearColor(0,0,0,0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    

                    gl.enable(gl.BLEND)
                    gl.blendFunc(gl.ONE, gl.ONE)
                    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                    gl.enableVertexAttribArray(v_id)
                    gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)
                    gl.drawArrays(gl.POINTS, 0, pointCount)
                    gl.disableVertexAttribArray(v_id)
                    gl.bindBuffer(gl.ARRAY_BUFFER, null)
                    gl.disable(gl.BLEND)

                    gl.disable(gl.SCISSOR_TEST)

                    // var buf = new Float32Array(4)
                    // gl.readPixels(0,0,1,1, gl.RGBA, gl.FLOAT, buf)
                    // console.log('sigma:', buf)
                }
            })()

            var computeAs = (function() {
                var prog = gl.createProgram()

                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-As-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_A = gl.getUniformLocation(prog, "u_A")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_scale = gl.getUniformLocation(prog, "u_scale")

                var v_pos = gl.getAttribLocation(prog, "v_pos")

                return function() {
                    gl.useProgram(prog)

                    var temp = grid.PCG1
                    grid.PCG1 = grid.PCG2
                    grid.PCG2 = temp
                    
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 0);
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                    gl.uniform1i(u_pcg, 1);
                    gl.activeTexture(gl.TEXTURE2)
                    gl.bindTexture(gl.TEXTURE_2D, grid.P.tex)
                    gl.uniform1i(u_A, 2);

                    gl.uniform1f(u_scale, 1 / (grid.cellSize * grid.cellSize))

                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    gl.disableVertexAttribArray(v_pos)
                }
            })()

            var clearZ = (function() {
                var progClear = gl.createProgram()
                var vsClear = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fsClear = getShader(require('./shaders/pressure-clearZ-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(progClear, [vsClear, fsClear]);
                var u_pcgClear = gl.getUniformLocation(progClear, "u_pcg")
                var v_posClear = gl.getAttribLocation(progClear, "v_pos")

                return function() {
                    var temp = grid.PCG1
                    grid.PCG1 = grid.PCG2
                    grid.PCG2 = temp

                    gl.useProgram(progClear)
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                    gl.uniform1i(u_pcgClear, 0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                    gl.enableVertexAttribArray(v_posClear)
                    gl.vertexAttribPointer(v_posClear, 2, gl.FLOAT, false, 0, 0)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    gl.disableVertexAttribArray(v_posClear)
                }
            })()

            var setZ = (function() {

                var progClear = gl.createProgram()
                var vsClear = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fsClear = getShader(require('./shaders/pressure-clearZ-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(progClear, [vsClear, fsClear]);
                var u_pcgClear = gl.getUniformLocation(progClear, "u_pcg")
                var v_posClear = gl.getAttribLocation(progClear, "v_pos")

                var prog = gl.createProgram()

                var vs = getShader(require('./shaders/pressure-applyA-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/set-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_A = gl.getUniformLocation(prog, "u_A")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_scale = gl.getUniformLocation(prog, "u_scale")

                var v_id = gl.getAttribLocation(prog, "v_id")

                var pointCount = 7*grid.count[0]*grid.count[1]*grid.count[2]
                var pointBuffer = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                var data = new Float32Array(pointCount)
                for (var i = 0; i < pointCount; ++i) { data[i] = i }
                gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, null)

                return function() {
                    var temp;

                    temp = grid.PCG1
                    grid.PCG1 = grid.PCG2
                    grid.PCG2 = temp

                    gl.useProgram(progClear)
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                    gl.uniform1i(u_pcgClear, 0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                    gl.enableVertexAttribArray(v_posClear)
                    gl.vertexAttribPointer(v_posClear, 2, gl.FLOAT, false, 0, 0)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    gl.disableVertexAttribArray(v_posClear)


                    gl.useProgram(prog)

                    temp = grid.PCG1
                    grid.PCG1 = grid.PCG2
                    grid.PCG2 = temp

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.P.tex)
                    gl.uniform1i(u_A, 0);
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                    gl.uniform1i(u_pcg, 1);

                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                    gl.uniform1f(u_scale, 1 / (grid.cellSize * grid.cellSize))

                    // gl.clearColor(0,0,0,0)
                    // gl.clear(gl.COLOR_BUFFER_BIT)

                    gl.enable(gl.BLEND)
                    gl.blendFunc(gl.ONE, gl.ONE)
                    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                    gl.enableVertexAttribArray(v_id)
                    gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)
                    gl.drawArrays(gl.POINTS, 0, pointCount)
                    gl.disableVertexAttribArray(v_id)
                    gl.bindBuffer(gl.ARRAY_BUFFER, null)
                    gl.disable(gl.BLEND)

                }
            })()

            var computeAlpha = (function() {
                var prog = gl.createProgram()
                
                var vs = getShader(require('./shaders/pressure-alpha-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/set-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")

                var v_id = gl.getAttribLocation(prog, "v_id")

                var pointCount = grid.count[0]*grid.count[1]*grid.count[2]
                var pointBuffer = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                var data = new Float32Array(pointCount)
                for (var i = 0; i < pointCount; ++i) { data[i] = i }
                gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, null)

                return function() {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG1.tex)
                    gl.uniform1i(u_pcg, 0);
                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex.fbo)
                    gl.enable(gl.SCISSOR_TEST)
                    gl.viewport(1,0,1,1)
                    gl.scissor(1,0,1,1)
                    gl.clearColor(0,0,0,0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    

                    gl.enable(gl.BLEND)
                    gl.blendFunc(gl.ONE, gl.ONE)
                    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                    gl.enableVertexAttribArray(v_id)
                    gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)
                    gl.drawArrays(gl.POINTS, 0, pointCount)
                    gl.disableVertexAttribArray(v_id)
                    gl.bindBuffer(gl.ARRAY_BUFFER, null)
                    gl.disable(gl.BLEND)

                    gl.disable(gl.SCISSOR_TEST)

                    // var buf = new Float32Array(4)
                    // gl.readPixels(0,0,1,1, gl.RGBA, gl.FLOAT, buf)
                    // console.log('sigma:', buf[0])
                    // gl.readPixels(1,0,1,1, gl.RGBA, gl.FLOAT, buf)
                    // console.log('alphap:', buf[0])
                }
            })()

            var updateGuess = (function() {
                var prog = gl.createProgram();
                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-updateGuess-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs])

                var v_pos = gl.getAttribLocation(prog, "v_pos")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_count = gl.getUniformLocation(prog, "u_count")

                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_const = gl.getUniformLocation(prog, "u_const")
                var u_alpha = gl.getUniformLocation(prog, "u_alpha")

                return function() {
                    gl.useProgram(prog)

                    var temp = grid.PCG1
                    grid.PCG1 = grid.PCG2
                    grid.PCG2 = temp

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                    gl.uniform1i(u_pcg, 0)

                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, tempTex.tex)
                    gl.uniform1i(u_const, 1)

                    // gl.uniform1f(u_alpha, alpha)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)

                    gl.viewport(0,0,grid.textureLength,grid.textureLength)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    gl.disableVertexAttribArray(v_pos)
                        
                }
            })()

            var recomputeResidual = (function() {
                
                var prog = gl.createProgram()

                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-recomputeResidual-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_A = gl.getUniformLocation(prog, "u_A")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_div = gl.getUniformLocation(prog, "u_div")
                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_scale = gl.getUniformLocation(prog, "u_scale")

                var v_pos = gl.getAttribLocation(prog, "v_pos")

                return function() {
                    gl.useProgram(prog)

                    var temp = grid.PCG1
                    grid.PCG1 = grid.PCG2
                    grid.PCG2 = temp
                    
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 0);
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                    gl.uniform1i(u_pcg, 1);
                    gl.activeTexture(gl.TEXTURE2)
                    gl.bindTexture(gl.TEXTURE_2D, grid.P.tex)
                    gl.uniform1i(u_A, 2);
                    gl.activeTexture(gl.TEXTURE3)
                    gl.bindTexture(gl.TEXTURE_2D, grid.div.tex)
                    gl.uniform1i(u_div, 3);

                    gl.uniform1f(u_scale, 1 / (grid.cellSize * grid.cellSize))

                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    gl.disableVertexAttribArray(v_pos)
                }
            })

            var updateSearch = (function() {
                var prog = gl.createProgram();
                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-updateSearch-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs])

                var v_pos = gl.getAttribLocation(prog, "v_pos")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_count = gl.getUniformLocation(prog, "u_count")

                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_const = gl.getUniformLocation(prog, "u_const")
                var u_beta = gl.getUniformLocation(prog, "u_beta")

                return function() {
                    gl.useProgram(prog)

                    var temp = grid.PCG1
                    grid.PCG1 = grid.PCG2
                    grid.PCG2 = temp

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                    gl.uniform1i(u_pcg, 0)

                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, tempTex.tex)
                    gl.uniform1i(u_const, 1)

                    // gl.uniform1f(u_beta, beta)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)

                    gl.viewport(0,0,grid.textureLength,grid.textureLength)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    gl.disableVertexAttribArray(v_pos)
                }
            })()

            var velocityUpdate = (function() {
                var prog = gl.createProgram()
                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER)
                var fs = getShader(require('./shaders/pressure-velocityUpdate-frag.glsl'), gl.FRAGMENT_SHADER)
                addShaders(prog, [vs, fs])

                var v_pos = gl.getAttribLocation(prog, "v_pos")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_count = gl.getUniformLocation(prog, "u_count")

                var u_grid = gl.getUniformLocation(prog, "u_grid")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_scale = gl.getUniformLocation(prog, "u_scale")
                
                return function(t) {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                    gl.uniform1i(u_grid, 0)

                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, grid.PCG1.tex)
                    gl.uniform1i(u_pcg, 1)

                    gl.activeTexture(gl.TEXTURE2)
                    gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                    gl.uniform1i(u_types, 2)

                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform1f(u_scale, 1 / grid.cellSize)

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                    
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                    
                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    gl.disableVertexAttribArray(v_pos)

                    grid.swap()
                }
            })()

            return function(t, shouldPrecondition) {
                clearMatrices()
                // setupA(t)
                buildA()
                setupb()

                if (shouldPrecondition) {
                    precondition()
                    preconditionZ(true)
                }
                
                var buf = new Float32Array(4*grid.textureLength*grid.textureLength)

                for (var i = 0; i < solverSteps; ++i) {
                    
                    computeSigma(false, shouldPrecondition)
                    
                    // var sigma = 0.0;
                    // gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    // gl.readPixels(0,0,grid.textureLength,grid.textureLength,gl.RGBA, gl.FLOAT, buf)
                    // for (var j = 0; j < grid.count[0]*grid.count[1]*grid.count[2]; ++j) {
                    //     sigma += buf[4*j + 1] * buf[4*j + 2];
                    // }

                    // setZ()
                    clearZ()
                    computeAs()
                    computeAlpha()
                    

                    // var alphap = 0.0;
                    // gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    // gl.readPixels(0,0,grid.textureLength,grid.textureLength,gl.RGBA, gl.FLOAT, buf)
                    // for (var j = 0; j < grid.count[0]*grid.count[1]*grid.count[2]; ++j) {
                    //     alphap += buf[4*j + 2] * buf[4*j + 3];
                    // }
                    // alpha = sigma / alphap;
                    // console.log('alpha:', sigma / alphap, sigma, alphap);

                    // gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex.fbo)
                    // gl.readPixels(0,0,2,2, gl.RGBA, gl.FLOAT, buf)
                    // console.log('alpha:', buf[0] / buf[4], buf[0], buf[4])

                    updateGuess()
                    // break;
                    // recomputeResidual()

                    // var max = 0.0;
                    // gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    // gl.readPixels(0,0,grid.textureLength,grid.textureLength,gl.RGBA, gl.FLOAT, buf)
                    // for (var j = 0; j < grid.count[0]*grid.count[1]*grid.count[2]; ++j) {
                    //     var val = Math.abs(buf[4*j + 1]);
                    //     if (val > max) max = val;
                    // }
                    // console.log(i, 'error:', max)

                    if (shouldPrecondition) {
                        clearZ()
                        preconditionZ(false)
                    }
                    computeSigma(true, shouldPrecondition)

                    // var sigmanew = 0.0;
                    // gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                    // gl.readPixels(0,0,grid.textureLength,grid.textureLength,gl.RGBA, gl.FLOAT, buf)
                    // for (var j = 0; j < grid.count[0]*grid.count[1]*grid.count[2]; ++j) {
                    //     sigmanew += buf[4*j + 1] * buf[4*j + 2];
                    // }
                    // beta = sigmanew / sigma;
                    // console.log('beta:', sigmanew / sigma, sigmanew, sigma)

                    // gl.bindFramebuffer(gl.FRAMEBUFFER, tempTex.fbo)
                    // gl.readPixels(0,0,2,2, gl.RGBA, gl.FLOAT, buf)
                    // console.log('beta:', buf[8] / buf[0], buf[8], buf[0])

                    updateSearch()
                }
                // var max = 0.0;
                // gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                // gl.readPixels(0,0,grid.textureLength,grid.textureLength,gl.RGBA, gl.FLOAT, buf)
                // for (var j = 0; j < grid.count[0]*grid.count[1]*grid.count[2]; ++j) {
                //     var val = Math.abs(buf[4*j + 1]);
                //     if (val > max) max = val;
                // }
                // console.log('error:', max)

                velocityUpdate(t)
            }
        })()

        var extrapolateVelocity = (function() {
            
            var prog = gl.createProgram();
            var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/extrapolate-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs])

            var v_pos = gl.getAttribLocation(prog, "v_pos")
            var u_texLength = gl.getUniformLocation(prog, "u_texLength")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
            var u_grid = gl.getUniformLocation(prog, "u_grid")
            var u_types = gl.getUniformLocation(prog, "u_types")
            var u_count = gl.getUniformLocation(prog, "u_count")

            return function() {
                gl.useProgram(prog);

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(u_grid, 0)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                gl.uniform1i(u_types, 1)

                gl.uniform1i(u_texLength, grid.textureLength)
                gl.uniform1f(u_cellSize, grid.cellSize)
                gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                gl.disableVertexAttribArray(v_pos)

                grid.swap()

            }
        })()

        var updateVelocities = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/updateVel-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/updateVel-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var u_gA = gl.getUniformLocation(prog, "u_gA")
            var u_gOld = gl.getUniformLocation(prog, "u_gOld")
            var u_particles = gl.getUniformLocation(prog, "u_particles")
            var u_particleTexLength = gl.getUniformLocation(prog, "u_particleTexLength")
            var u_gridTexLength = gl.getUniformLocation(prog, "u_gridTexLength")
            var u_copy = gl.getUniformLocation(prog, "u_copy")
            
            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
            var u_count = gl.getUniformLocation(prog, "u_count")
            var u_t = gl.getUniformLocation(prog, "u_t")

            var v_id = gl.getAttribLocation(prog, "v_id")

            var pointCount = 2*particles.length
            var pointBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
            var data = new Float32Array(pointCount)
            for (var i = 0; i < pointCount; ++i) { data[i] = i }
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

            return function(t) {
                gl.useProgram(prog)
                
                gl.bindFramebuffer(gl.FRAMEBUFFER, particles.B.fbo)
                gl.viewport(0, 0, particles.textureLength, particles.textureLength)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(u_gA, 1)

                gl.activeTexture(gl.TEXTURE2)
                gl.bindTexture(gl.TEXTURE_2D, grid.old.tex)
                gl.uniform1i(u_gOld, 2)

                gl.uniform1i(u_particleTexLength, particles.textureLength)
                gl.uniform1i(u_gridTexLength, grid.textureLength)
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
                gl.uniform1f(u_cellSize, grid.cellSize)
                gl.uniform1f(u_t, t);

                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.drawArrays(gl.POINTS, 0, pointCount)

                gl.disableVertexAttribArray(v_id)

                gl.bindBuffer(gl.ARRAY_BUFFER, null)
                gl.bindTexture(gl.TEXTURE_2D, null)
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)

                particles.swap()
            }
        })()

        var updatePositions = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/advect-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/advect-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var v_id = gl.getAttribLocation(prog, "v_id")
            var u_particles = gl.getUniformLocation(prog, "u_particles")
            var u_particleTexLength = gl.getUniformLocation(prog, "u_particleTexLength")
            var u_t = gl.getUniformLocation(prog, "u_t")
            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_max = gl.getUniformLocation(prog, "u_max")
            var u_offset = gl.getUniformLocation(prog, "u_offset")

            var pointCount = 2*particles.length
            var pointBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
            var data = new Float32Array(pointCount)
            for (var i = 0; i < pointCount; ++i) { data[i] = i }
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

            return function(t) {
                gl.useProgram(prog)

                gl.bindFramebuffer(gl.FRAMEBUFFER, particles.B.fbo)
                gl.viewport(0, 0, particles.textureLength, particles.textureLength)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

                gl.uniform1f(u_t, t)
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3fv(u_max, grid.max)
                gl.uniform1i(u_particleTexLength, particles.textureLength)
                gl.uniform1f(u_offset, 0.05*grid.cellSize)

                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.drawArrays(gl.POINTS, 0, pointCount)

                gl.disableVertexAttribArray(v_id)
                gl.bindBuffer(gl.ARRAY_BUFFER, null)
                gl.bindTexture(gl.TEXTURE_2D, null)
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)

                particles.swap()
            }
        })()

        return {
            step: function(t, shouldPrecondition) {
                gl.clearColor(0, 0, 0, 0.0);
                gl.disable(gl.DEPTH_TEST)

                clearGridVelocity()
                
                projectToGrid();

                copyGrid()

                markCells();

                gravityUpdate(t);

                enforceBoundary();

                pressureSolve(t, shouldPrecondition);

                enforceBoundary();

                extrapolateVelocity();

                enforceBoundary();

                updateVelocities(t);

                updatePositions(t);

            },
            shouldUpdate: false
        }
    }

    return {
        Sim
    }
}