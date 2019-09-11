var Renderer = {
    Run : function()
    {
        this.Setup();
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        this.gl.useProgram(this.program);

        var colors = [vec4(1, 0, 0, 1), vec4(0, 1, 0, 1), vec4(0, 0, 1, 1)];
        var vertices = [vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5)];

        this.SendFloatData("a_Position", vertices, 2);
        this.SendFloatData("a_Color", colors, 4);
        this.Draw(vertices.length);
    },

    Draw : function(vertexCount)
    {
        var gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
    },

    Setup : function()
    {
        var canvas = document.getElementById("c");
        this.gl = setupWebGL(canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
    },
    
    SendFloatData : function(name, data, size)
    {
        var gl = this.gl;
        var dataBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

        var vPos = gl.getAttribLocation(this.program, name);
        gl.vertexAttribPointer(vPos, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
    }
}

/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
  return WebGLUtils.setupWebGL(canvas);
}

onload = Renderer.Run();
