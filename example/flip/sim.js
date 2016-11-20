'use strict'

export default function (gl) {
    function Sim (grid, particles) {

        var projectToGrid = function() {

        }

        var gravityUpdate = function() {

        }

        var updateParticles = function() {

        }

        return {
            step: function() {
                projectToGrid();
                gravityUpdate();
                updateParticles();
            }
        }
    }

    return {
        Sim
    }
}