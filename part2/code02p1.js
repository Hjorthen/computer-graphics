
var Renderer = {

    /**
     * @type {WebGLRenderingContext}
     */
    gl : null,
    Run : function()
    {
        this.Setup();
        var gl = this.gl;
        this.vertices = [vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5)];
        this.vertexBuffer = gl.createBuffer();
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, 1024, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.vertices));
        var vPos = gl.getAttribLocation(this.program, "a_Position");
        gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);

        this.canvas.addEventListener("click", this.OnClick.bind(this));
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },

    OnClick : function()
    {
        var boundingRect = event.target.getBoundingClientRect();
        var pos = subtract(vec2(event.x, event.y), vec2(boundingRect.left, boundingRect.top));
        var offset = vec2(boundingRect.width*0.5, boundingRect.height*0.5);
        
        var centeredPos = subtract(pos, offset);

        var normalizedPos = vec2(centeredPos[0] / (0.5*boundingRect.width), -centeredPos[1] / (0.5*boundingRect.height));

        console.log(normalizedPos);
        this.AddDot(normalizedPos);
    },

    AddDot : function(position)
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec2']*this.vertices.length, flatten(position)); 
        this.vertices.push(position);
    },

    Draw : function()
    {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.POINTS, 0, this.vertices.length);
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
    Setup : function()
    {
        this.canvas = document.getElementById("c");
        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
    }
}

/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
  return WebGLUtils.setupWebGL(canvas);
}

onload= Renderer.Run();
