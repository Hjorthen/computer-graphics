var Renderer = {
    
    /**
     * @type {WebGLRenderingContext}
     */
    gl : null,
    bufferSize : 1024,
    clearColor : vec4(1, 0, 0, 1),
    drawColor : vec4(0, 0, 0, 1),
    Setup()
    {
        this.canvas = document.getElementById("c");
        this.mode = document.getElementById("modePicker");
        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
    },

    GetDrawMode()
    {
        return this.mode.selectedIndex + 1; 
    },

    Run()
    {
        this.Setup();
        var gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(this.program);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferSize, gl.STATIC_DRAW);
        var vPos = gl.getAttribLocation(this.program, "a_Position");
        gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
        this.vertices = [];

        // Setup index buffers for points
        this.pointsIndiceBuffer = new GLBuffer(this.bufferSize, gl.ELEMENT_ARRAY_BUFFER, gl); 

        this.circleIndiceBuffer = new GLBuffer(this.bufferSize, gl.ELEMENT_ARRAY_BUFFER, gl);

        // Setup index buffers for triangles
        this.triangleIndiceBuffer = new GLBuffer(this.bufferSize, gl.ELEMENT_ARRAY_BUFFER, gl); 

        this.colors = [];
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferSize, gl.STATIC_DRAW);
        var vCol = gl.getAttribLocation(this.program, "a_Color");
        gl.vertexAttribPointer(vCol, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vCol);

        button = document.getElementById("clearButton");
        button.addEventListener("click", this.OnClear.bind(this));
        this.canvas.addEventListener("click", this.OnClick.bind(this));
        
        this.dotCounter = 0;
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
        
        this.pointsIndiceBuffer.Clear();
        this.triangleIndiceBuffer.Clear();
        this.circleIndiceBuffer.Clear();

        this.vertices = [];
        this.colors = [];
    },

    OnClick : function(event)
    {
        var boundingRect = event.target.getBoundingClientRect();
        var pos = subtract(vec2(event.x, event.y), vec2(boundingRect.left, boundingRect.top));
        var offset = vec2(boundingRect.width*0.5, boundingRect.height*0.5);
        
        var centeredPos = subtract(pos, offset);
        var z = 1 - 2*((this.vertices.length + 1) / this.bufferSize);
        var normalizedPos = vec3(centeredPos[0] / (0.5*boundingRect.width), -centeredPos[1] / (0.5*boundingRect.height), z);
        this.AddDot(normalizedPos);
    },

    AddDot : function(position)
    {

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        var vertexIndex = this.vertices.length;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec3']*vertexIndex, flatten(position)); 
        this.vertices.push(position);
        
        if(this.GetDrawMode() === 2 && (++this.dotCounter) % 3 == 0)
        {
            this.pointsIndiceBuffer.Strip(2);
            this.dotCounter = 0;
        }
        else if(this.GetDrawMode() == 3 && (++this.dotCounter) % 2 == 0)
        {
            this.pointsIndiceBuffer.Strip(1);
            this.dotCounter = 0;
            
            // Remove the 2nd vertex
            this.vertices.pop();
            var lastPosition = this.vertices[this.vertices.length - 1];

            var circleWidth = Math.sqrt(Math.pow(lastPosition[0] - position[0], 2) + Math.pow(lastPosition[1] - position[1], 2));

            // Render triangles
            const triangleCount = 8;
            var offset = (2 * Math.PI) / triangleCount;
            var startingIndex = this.vertices.length;
            this.circleIndiceBuffer.Add(startingIndex - 1);
            for(var i=0;i<=triangleCount;++i)
            {
                var angle = offset * i;
                this.colors.push(this.drawColor);
                var vertexPosition = vec3(circleWidth * Math.cos(angle), circleWidth * Math.sin(angle), position[2]); 
                vertexPosition[0] += lastPosition[0];
                vertexPosition[1] += lastPosition[1];

                this.vertices.push(vertexPosition);
                this.circleIndiceBuffer.Add(this.vertices.length - 1);
            }

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec3']*startingIndex, flatten(this.vertices.slice(startingIndex))); 

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec4']*startingIndex, flatten(this.colors.slice(startingIndex)));
            return;
        }
        else
        {
            this.pointsIndiceBuffer.Add(vertexIndex);
        }

        if(this.GetDrawMode() === 2) 
        {
            this.triangleIndiceBuffer.Add(vertexIndex);
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec4']*this.colors.length, flatten(this.drawColor));
        this.colors.push(this.drawColor);
    },

    Draw : function()
    {
        this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.circleIndiceBuffer.Bind();
        this.gl.drawElements(this.gl.TRIANGLE_FAN, this.circleIndiceBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);
        this.triangleIndiceBuffer.Bind();
        this.gl.drawElements(this.gl.TRIANGLES, this.triangleIndiceBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);
        this.pointsIndiceBuffer.Bind();
        this.gl.drawElements(this.gl.POINTS, this.pointsIndiceBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);


        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
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
