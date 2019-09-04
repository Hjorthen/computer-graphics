OnLoad = WebGL();

/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
  return WebGLUtils.setupWebGL(canvas);
}

function WebGL()
{
    console.log("Hello?");
    var canvas = document.getElementById("c");
    var gl = setupWebGL(canvas);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
