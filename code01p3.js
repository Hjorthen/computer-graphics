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
    var canvas = document.getElementById("c");
    var gl = setupWebGL(canvas);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    var vertices = [vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5)];
    var vertexBuffer = gl.createBuffer();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPos = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, vertices.length);
}
