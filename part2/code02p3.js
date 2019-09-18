var Renderer = {
    
    /**
     * @type {WebGLRenderingContext}
     */
    gl : null,
    bufferSize : 1024,
    clearColor : vec4(1, 0, 0, 1),
    drawColor : vec4(0, 0, 0, 1),
    Setup : function()
    {
        this.canvas = document.getElementById("c");
        this.mode = document.getElementById("modePicker");
        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
    },

    Run : function()
    {
        this.Setup();

        this.gl.useProgram(this.program);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);
        var vPos = this.gl.getAttribLocation(this.program, "a_Position");
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);
        this.vertices = [];

        // Setup index buffers for points
        this.pointsIndiceBuffer = this.gl.createBuffer(); 
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.pointsIndiceBuffer); 
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);
        this.pointIndices = [];

        // Setup index buffers for trianthis.gles
        this.trianthis.gleIndiceBuffer = this.gl.createBuffer(); 
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.trianthis.gleIndiceBuffer); 
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);
        this.trianthis.gleIndices = [];


        this.colors = [this.drawColor, this.drawColor, this.drawColor];
        this.colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.colors));
        var vCol = this.gl.getAttribLocation(this.program, "a_Color");
        this.gl.vertexAttribPointer(vCol, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vCol);

        button = document.getElementById("clearButton");
        button.addEventListener("click", this.OnClear.bind(this));
        this.canvas.addEventListener("click", this.OnClick.bind(this));
        

        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },

    OnClear : function()
    {
       this.ClearCanvas(); 
    },

    ClearCanvas : function()
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.pointsIndiceBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleIndiceBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);

        this.vertices = [];
        this.colors = [];
    },

    OnClick : function()
    {
        var boundingRect = event.target.getBoundingClientRect();
        var pos = subtract(vec2(event.x, event.y), vec2(boundingRect.left, boundingRect.top));
        var offset = vec2(boundingRect.width*0.5, boundingRect.height*0.5);
        
        var centeredPos = subtract(pos, offset);

        var normalizedPos = vec2(centeredPos[0] / (0.5*boundingRect.width), -centeredPos[1] / (0.5*boundingRect.height));
        this.AddDot(normalizedPos);
    },

    AddDot : function(position)
    {

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        var vertexIndex = this.vertices.length;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec2']*vertexIndex, flatten(position)); 
        this.vertices.push(vertexIndex);

        this.pointIndices.push(position);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.pointsIndiceBuffer);
        if(this.pointIndices.length % 3 == 0)
        {
            // Clear the points
            this.pointIndices = [];
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferSize, this.gl.STATIC_DRAW);
        }
        else
        {
            var indiceIndex = this.pointIndices.length - 1;
            this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, indiceIndex, Uint8Array.from([vertexIndex]));
        }
       
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleIndiceBuffer);
        var triangleIndex = this.triangleIndices.length;
        this.triangleIndices.push(vertexIndex);
        this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, triangleIndex, Uint8Array.from([vertexIndex])); 


        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec4']*this.colors.length, flatten(this.drawColor));
        this.colors.push(this.drawColor);
    },

    Draw : function()
    {
        this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.pointsIndiceBuffer); 
        this.gl.drawElements(this.gl.POINTS, this.pointIndices.length, this.gl.UNSIGNED_BYTE, 0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleIndiceBuffer); 
        this.gl.drawElements(this.gl.TRIANGLES, this.triangleIndices.length, this.gl.UNSIGNED_BYTE, 0);

        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
    GetDrawMode : function()
    {
        if(this.mode.selectedIndex == 0)
            return this.gl.POINTS;
        else
            return this.gl.TRIANGLES;
    }
}

/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
  return WebGLUtils.setupWebGL(canvas);
}

colorMenu = document.getElementById("colorMenu");
colorMenu.addEventListener("change", function() {
    switch(colorMenu.selectedIndex) {
        case 0:
            Renderer.clearColor = (vec4(0, 0, 0, 1));
            break;
        case 1:
            Renderer.clearColor = (vec4(0, 0, 1, 1));
            break;
        case 2:
            Renderer.clearColor = (vec4(0, 1, 0, 1));
            break;
    }
});

colorPicker = document.getElementById("colorPicker");
colorPicker.addEventListener("change", function() {
    switch(colorPicker.selectedIndex) {
        case 0:
            Renderer.drawColor = vec4(0, 0, 0, 1);
            break;
        case 1:
            Renderer.drawColor = vec4(1, 0, 0, 1);
            break;
        case 2:
            Renderer.drawColor = vec4(1, 0.5, 0, 1);
            break;
    }
});

onload= Renderer.Run();
