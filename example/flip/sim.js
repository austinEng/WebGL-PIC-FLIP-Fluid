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

        var projectToGrid = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/project-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/project-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            // var u_iter = gl.getUniformLocation(prog, "u_iter")
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
            // var v_pos = gl.getAttribLocation(prog, "v_pos")
            // var v_vel = gl.getAttribLocation(prog, "v_vel")

            return function() {
                gl.useProgram(prog)
                // gl.bindBuffer(gl.ARRAY_BUFFER, particles.buffer)

                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 1)

                gl.uniform1i(u_particleTexLength, particles.textureLength)
                
                gl.uniform3fv(u_min, grid.min)
                gl.uniform3fv(u_max, grid.max)
                gl.uniform1f(u_cellSize, grid.cellSize)
                gl.uniform1i(u_texLength, grid.textureLength)
                // gl.uniform3i(u_count, grid.count[0], grid.count[1], grid.count[2])

                // if (v_pos >= 0) gl.enableVertexAttribArray(v_pos)
                // if (v_vel >= 0) gl.enableVertexAttribArray(v_vel)

                // if (v_pos >= 0) gl.vertexAttribPointer(v_pos, 3, gl.FLOAT, false, 4 * 3 * 2, 0)
                // if (v_vel >= 0) gl.vertexAttribPointer(v_vel, 3, gl.FLOAT, false, 4 * 3 * 2, 4 * 3)

                gl.bindBuffer(gl.ARRAY_BUFFER, particles.ids)
                gl.enableVertexAttribArray(v_id)
                gl.vertexAttribPointer(v_id, 1, gl.FLOAT, false, 0, 0)

                // for (let g of [grid.gU, grid.gV, grid.gW]) {
                    // gl.bindFramebuffer(gl.FRAMEBUFFER, grid.B.fbo)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                    gl.viewport(0, 0, grid.textureLength, grid.textureLength)
                    gl.clear(gl.COLOR_BUFFER_BIT)

                    // for (let i = 0; i < 8; ++i) {
                        // gl.uniform3i(u_iter, i & 0x100, 0x110, 0x001)
                        
                        // gl.uniform3fv(u_offset, g.offset)
                        // gl.uniform3i(u_count, g.count[0], g.count[1], g.count[2])
                        
                        // gl.viewport(0, 0, g.buffer.textureLength, g.buffer.textureLength)
                        // gl.drawArrays(gl.POINTS, 0, particles.length)
                        // gl.drawArrays(gl.POINTS, 0, particles.length / 6)
                    // }
                    for (let g = 0; g < 3; ++g) {
                        // let offset = vec3.fromValues(0.5, 0.5, 0.5)
                        // offset[g] = 0
                        // let count = vec3.create()
                        // vec3.sub(count, grid.max, offset)
                        // vec3.sub(count, count, grid.min)
                        // vec3.scale(count, count, 1 / grid.cellSize)
                        // vec3.add(count, count, vec3.fromValues(1,1,1))
                        // vec3.floor(count, count)
                        // gl.uniform3fv(u_offset, offset)
                        // gl.uniform3i(u_count, count[0], count[1], count[2])
                        gl.uniform1i(u_g, g);
                        for (let i = 0; i < 3; ++i) {
                            for (let j = 0; j < 3; ++j) {
                                for (let k = 0; k < 3; ++k) {
                                    gl.uniform3i(u_goffset, i - 1, j - 1, k - 1);
                                    gl.drawArrays(gl.POINTS, 0, particles.length)
                                }
                            }   
                        }
                    }
                // }

                gl.disableVertexAttribArray(v_id)

                // if (v_pos >= 0) gl.disableVertexAttribArray(v_pos)
                // if (v_vel >= 0) gl.disableVertexAttribArray(v_vel)
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

            if (v_pos >= 0) gl.vertexAttribPointer(v_pos, 2, gl.FLOAT, false, 0, 0)

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

        var updateVelocities = (function() {
            var prog = gl.createProgram()

            var vs = getShader(require('./shaders/updateVel-vert.glsl'), gl.VERTEX_SHADER);
            var fs = getShader(require('./shaders/updateVel-frag.glsl'), gl.FRAGMENT_SHADER);
            addShaders(prog, [vs, fs]);

            var u_gA = gl.getUniformLocation(prog, "u_gA")
            var u_gB = gl.getUniformLocation(prog, "u_gB")
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
                gl.bindTexture(gl.TEXTURE_2D, grid.B.tex)
                gl.uniform1i(u_gB, 2)

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

            return function(t) {
                gl.useProgram(prog)

                gl.bindFramebuffer(gl.FRAMEBUFFER, particles.B.fbo)
                gl.viewport(0, 0, particles.textureLength, particles.textureLength)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, particles.A.tex)
                gl.uniform1i(u_particles, 0)

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

                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE)
                // projectToGrid();
                gl.disable(gl.BLEND)

                gravityUpdate(t);

                
                // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                
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