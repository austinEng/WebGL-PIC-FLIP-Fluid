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

    function Sim (grid, particles) {

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

            var v_id = gl.getAttribLocation(prog, "v_id")
            var u_particles = gl.getUniformLocation(prog, "u_particles")
            var u_particleTexLength = gl.getUniformLocation(prog, "u_particleTexLength")


            var progAvg = gl.createProgram()
            
            var vsAvg = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fsAvg = getShader(require('./shaders/project-avg-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(progAvg, [vsAvg, fsAvg]);

            var v_pos = gl.getAttribLocation(progAvg, "v_pos")
            var gU_old = gl.getUniformLocation(progAvg, "gU_old")

            return function() {
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

                gl.disableVertexAttribArray(v_id)

                grid.swap()

                gl.useProgram(progAvg)
                
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(gU_old, 0)

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

            var u_particles = gl.getUniformLocation(prog, "u_particles")
            var u_particleTexLength = gl.getUniformLocation(prog, "u_particleTexLength")

            var v_id = gl.getAttribLocation(prog, "v_id")


            var prog2 = gl.createProgram()

            var vs2 = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs2 = getShader(require('./shaders/mark-edge-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog2, [vs2, fs2]);

            var v_pos = gl.getAttribLocation(prog2, "v_pos")
            var u_texLength2 = gl.getUniformLocation(prog2, "u_texLength")
            var u_count2 = gl.getUniformLocation(prog, "u_count")
            var u_cellSize2 = gl.getUniformLocation(prog2, "u_cellSize")

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

                gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.drawArrays(gl.POINTS, 0, particles.length)

                gl.disableVertexAttribArray(v_id)

                /*gl.useProgram(prog2)
                
                gl.uniform1i(u_texLength2, grid.textureLength)
                gl.uniform3i(u_count2, grid.count[0], grid.count[1], grid.count[2])
                gl.uniform1f(u_cellSize2, grid.cellSize)

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                gl.disableVertexAttribArray(v_pos)*/
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
            var setupA = (function() {
                var prog = gl.createProgram()
                
                var vs = getShader(require('./shaders/pressure-setupA-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/set-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs]);

                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_types = gl.getUniformLocation(prog, "u_types")
                var u_texLength = gl.getUniformLocation(prog, "u_textureLength")
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
                    gl.uniform1f(u_scale, t / grid.cellSize*grid.cellSize)

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
                    gl.uniform1f(u_scale, 1 / grid.cellSize)

                    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
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

            var updateZ = (function() {
                
                var prog = gl.createProgram();
                var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
                var fs = getShader(require('./shaders/pressure-preconditionz-frag.glsl'), gl.FRAGMENT_SHADER);
                addShaders(prog, [vs, fs])

                var v_pos = gl.getAttribLocation(prog, "v_pos")
                var u_texLength = gl.getUniformLocation(prog, "u_texLength")
                var u_count = gl.getUniformLocation(prog, "u_count")
                var u_A = gl.getUniformLocation(prog, "u_A")
                var u_pre = gl.getUniformLocation(prog, "u_pre")
                var u_pcg = gl.getUniformLocation(prog, "u_pcg")
                var u_iter = gl.getUniformLocation(prog, "u_iter")
                var u_step = gl.getUniformLocation(prog, "u_step")

                return function() {
                    gl.useProgram(prog)

                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, grid.P.tex)
                    gl.uniform1i(u_A, 0)
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, grid.MIC1.tex)
                    gl.uniform1i(u_pre, 1)

                    gl.uniform1i(u_texLength, grid.textureLength)
                    gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                    gl.enableVertexAttribArray(v_pos)
                    gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)


                    var temp

                    var N = Math.max(Math.max(grid.count[0], grid.count[1]), grid.count[2]);
                    gl.activeTexture(gl.TEXTURE2)
                    gl.uniform1i(u_pcg, 2)

                    gl.uniform1i(u_step, 0)
                    for (var i = 0; i < N; ++i) {
                        temp = grid.PCG1
                        grid.PCG1 = grid.PCG2
                        grid.PCG2 = temp

                        gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                        gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                        gl.uniform1i(u_iter, i)
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    }

                    gl.uniform1i(u_step, 1)
                    for (var i = N-1; i >= 0; --i) {
                        temp = grid.PCG1
                        grid.PCG1 = grid.PCG2
                        grid.PCG2 = temp

                        gl.bindFramebuffer(gl.FRAMEBUFFER, grid.PCG1.fbo)
                        gl.bindTexture(gl.TEXTURE_2D, grid.PCG2.tex)
                        gl.uniform1i(u_iter, i)
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    }

                    gl.disableVertexAttribArray(v_pos)
                }
            })()

            return function(t) {
                setupA(t)
                setupb()
                precondition()
                //updateZ()
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

                gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.uniform1i(u_copy, 0)
                gl.drawArrays(gl.POINTS, 0, particles.length)
                gl.uniform1i(u_copy, 1)
                gl.drawArrays(gl.POINTS, 0, particles.length)

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
            var u_copy = gl.getUniformLocation(prog, "u_copy")
            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_max = gl.getUniformLocation(prog, "u_max")

            return function(t) {
                gl.useProgram(prog)

                // gl.bindFramebuffer(gl.FRAMEBUFFER, particles.B.fbo)
                // var data = new Float32Array(3600)
                // gl.readPixels(0,0,3600,0,gl.RGBA, gl.FLOAT, data);
                // console.log(data)

                gl.bindFramebuffer(gl.FRAMEBUFFER, particles.B.fbo)
                gl.viewport(0, 0, particles.textureLength, particles.textureLength)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

                gl.uniform1f(u_t, t)
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3fv(u_max, grid.max)
                gl.uniform1i(u_particleTexLength, particles.textureLength)

                gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.uniform1i(u_copy, 0)
                gl.drawArrays(gl.POINTS, 0, particles.length)
                gl.uniform1i(u_copy, 1)
                gl.drawArrays(gl.POINTS, 0, particles.length)

                gl.disableVertexAttribArray(v_id)
                gl.bindBuffer(gl.ARRAY_BUFFER, null)
                gl.bindTexture(gl.TEXTURE_2D, null)
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)

                particles.swap()
            }
        })()

        return {
            step: function(t) {
                gl.clearColor(0, 0, 0, 0.0);
                gl.disable(gl.DEPTH_TEST)

                clearGridVelocity()
                
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE)
                projectToGrid();
                gl.disable(gl.BLEND)

                copyGrid()

                markCells();

                gravityUpdate(t);

                enforceBoundary();

                pressureSolve(t);

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