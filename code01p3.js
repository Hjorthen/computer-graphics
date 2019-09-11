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

    gl.useProgram(program);

    var colors = [vec4(1, 0, 0, 1), vec4(0, 1, 0, 1), vec4(0, 0, 1, 1)];
    var vertices = [vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5)];

    SendFloatData("a_Position", vertices, 2, gl, program);
    SendFloatData("a_Color", colors, 4, gl, program);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
}


function SendFloatData(name, data, size, gl, program)
{
    var dataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

    var vPos = gl.getAttribLocation(program, name);
    gl.vertexAttribPointer(vPos, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
}
