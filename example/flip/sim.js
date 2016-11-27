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

        // var fbos = {
        //     gU: gl.createFramebuffer(),
        //     gV: gl.createFramebuffer(),
        //     gW: gl.createFramebuffer(),
        //     gU_old: gl.createFramebuffer(),
        //     gV_old: gl.createFramebuffer(),
        //     gW_old: gl.createFramebuffer(),
        //     gP: gl.createFramebuffer(),
        //     gType: gl.createFramebuffer()
        // }

        // for (let fbo in fbos) {
        //     gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[fbo])
        //     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, grid[fbo].buffer.texture, 0)
        // }

        // gl.bindFramebuffer(gl.FRAMEBUFFER, null)

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
                // gl.useProgram(prog)

                // gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                // gl.enableVertexAttribArray(v_pos)
                // gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                
                // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                // gl.disableVertexAttribArray(v_pos)

                // grid.swap()
            }
        })()

        var projectToGrid = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/project-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/project-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_max = gl.getUniformLocation(prog, "u_max")
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
                // gl.bindBuffer(gl.ARRAY_BUFFER, particles.buffer)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

                gl.uniform1i(u_particleTexLength, particles.textureLength)
                
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3fv(u_max, grid.max)
                gl.uniform1f(u_cellSize, grid.cellSize)
                gl.uniform1i(u_texLength, grid.textureLength)
                // gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                // gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                // gl.clear(gl.COLOR_BUFFER_BIT)

                for (let g = 0; g < 3; ++g) {
                    gl.uniform1i(u_g, g);
                    for (let i = -1; i < 2; ++i) {
                        for (let j = -1; j < 2; ++j) {
                            for (let k = -1; k < 2; ++k) {
                                gl.uniform3i(u_goffset, i, j, k);
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

            return function(t) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.useProgram(prog)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(gU_old, 0)
                gl.uniform1f(u_t, t)

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
            var u_max = gl.getUniformLocation(prog, "u_max")
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
            var u_min2 = gl.getUniformLocation(prog2, "u_min")
            var u_max2 = gl.getUniformLocation(prog2, "u_max")
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
                gl.uniform3fv(u_max, grid.max)

                gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                gl.drawArrays(gl.POINTS, 0, particles.length)

                gl.disableVertexAttribArray(v_id)

                // gl.bindFramebuffer(gl.FRAMEBUFFER, grid.T.fbo)
                // var data = new Float32Array(240);
                // gl.readPixels(0,0,240,0, gl.RGBA, gl.FLOAT, data);
                // console.log(data)


                /*gl.useProgram(prog2)
                
                gl.uniform1i(u_texLength2, grid.textureLength)
                gl.uniform3fv(u_min2, grid.min)
                gl.uniform3fv(u_max2, grid.max)
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

        var extrapolateVelocity = (function() {
            
            var prog = gl.createProgram();
            var vs = getShader(require('./shaders/quad-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/extrapolate-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs])

            var v_pos = gl.getAttribLocation(prog, "v_pos")
            var u_texLength = gl.getUniformLocation(prog, "u_texLength")
            var u_texLength2 = gl.getUniformLocation(prog, "u_texLength2")
            var u_min = gl.getUniformLocation(prog, "u_min")
            var u_max = gl.getUniformLocation(prog, "u_max")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
            var u_grid = gl.getUniformLocation(prog, "u_grid")
            var u_types = gl.getUniformLocation(prog, "u_types")
            var v_id = gl.getAttribLocation(prog, "v_id")

            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            var data = new Float32Array(grid.count[0]*grid.count[1]*grid.count[2])
            for (var i = 0; i < data.length; ++i) {
                data[i] = [i];
            }
            buf.length = data.length;
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

            return function() {
                gl.useProgram(prog);

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(u_grid, 0)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, grid.T.tex)
                gl.uniform1i(u_types, 1)

                gl.uniform1i(u_texLength, grid.textureLength)
                gl.uniform1i(u_texLength2, grid.textureLength)
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3fv(u_max, grid.max)
                gl.uniform1f(u_cellSize, grid.cellSize)

                gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                gl.viewport(0, 0, grid.textureLength, grid.textureLength)

                gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)
                
                gl.enableVertexAttribArray(v_pos)
                gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                gl.disableVertexAttribArray(v_pos)

                // gl.bindBuffer(gl.ARRAY_BUFFER, buf)
                // gl.enableVertexAttribArray(v_id)
                // gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0,0)

                // gl.drawArrays(gl.POINTS, 0, buf.length)

                // gl.disableVertexAttribArray(v_id)

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
            var u_max = gl.getUniformLocation(prog, "u_max")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")
            var u_count = gl.getUniformLocation(prog, "u_count")

            var v_id = gl.getAttribLocation(prog, "v_id")

            return function() {
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
                gl.uniform3fv(u_max, grid.max)
                gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])
                gl.uniform1f(u_cellSize, grid.cellSize)

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

            var u_grid = gl.getUniformLocation(prog, "u_grid")
            var u_texLength = gl.getUniformLocation(prog, "u_texLength")
            var u_cellSize = gl.getUniformLocation(prog, "u_cellSize")

            return function(t) {
                gl.useProgram(prog)

                gl.bindFramebuffer(gl.FRAMEBUFFER, particles.B.fbo)
                gl.viewport(0, 0, particles.textureLength, particles.textureLength)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, grid.A.tex)
                gl.uniform1i(u_grid, 1)
                gl.uniform1i(u_texLength, grid.textureLength)
                gl.uniform1f(u_cellSize, grid.cellSize)

                gl.uniform1f(u_t, t)
                gl.uniform1i(u_particleTexLength, particles.textureLength)

                gl.uniform3fv(u_min, grid.min)
                gl.uniform3fv(u_max, grid.max)

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

                // var data = new Float32Array(6*4)
                // gl.readPixels(0, 0, 6, 1, gl.RGBA, gl.FLOAT, data)
                // console.log(data)
                // gl.bindTexture(gl.TEXTURE_2D, particles.B.tex)
                // var data = new Float32Array(2*4);
                // gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, data)
                // console.log("A pos", data)

                // gl.bindTexture(gl.TEXTURE_2D, particles.B.tex)
                // data = new Float32Array(2*4);
                // gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, data)
                // console.log("B pos", data)

                var data = new Float32Array(2*4);

                // gl.bindFramebuffer(gl.FRAMEBUFFER, particles.A.fbo)
                // gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, data)
                // console.log("pre pos", data)

                particles.swap()

                // gl.bindFramebuffer(gl.FRAMEBUFFER, particles.A.fbo)
                // gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, data)
                // console.log("post pos", data)

                
                // gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo)

                // gl.enableVertexAttribArray(v_pos)
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

                gravityUpdate(t);
                
                markCells();

                enforceBoundary();

                // pressureUpdate

                // enforceBoundary();

                extrapolateVelocity();

                enforceBoundary();

                updateVelocities();

                updatePositions(t);

                // gl.disable(gl.BLEND)
            }
        }
    }

    return {
        Sim
    }
}