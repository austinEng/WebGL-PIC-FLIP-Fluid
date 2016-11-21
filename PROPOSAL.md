WebGL PIC/FLIP Fluid Simulation
===============================

There exist WebGL fluid simulations, but the ones that I have seen do not use efficient methods for solving pressure and do not make use of newer WebGL 2 features such as transform feedback. This pressure solve is the most expensive computation in the fluid simulation. In my experience, switching from a naive solve to a Conjugate Gradient with Incomplete Cholesky preconditioner sometimes more than doubles the performance of a CPU solver.

I want to write a fluid solver using WebGL fragment/vertex shaders as compute shaders to implement an efficient PIC/FLIP fluid solver as well as make use of features in WebGL 2 such as transform feedback that would make the solver even more performant.

As this project would rely heavily on compute shaders which WebGL does not have, a stretch goal is to be able to design an abstracted WebGL compute framework to simplify packing/unpacking data and shader creation. Making a fragment shader that did compute was a big obstacle in my WebGL deferred shader project and I hope to make a framework to simplify that process. It would also be great if the framework could easily fall back on WebGL 1 features for more portability.