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

    DrawCube()
    {   /*   6-----5
         *  /|    /|
         * 1-----0 |
         * | 7---|-4 
         * |/    |/
         * 2-----3
         */
        var vertices = [
            vec4( 1.0,  1.0,  1.0),
            vec4(-1.0,  1.0,  1.0),
            vec4(-1.0, -1.0,  1.0),
            vec4( 1.0, -1.0,  1.0),
            vec4( 1.0, -1.0, -1.0),
            vec4( 1.0,  1.0, -1.0),
            vec4(-1.0,  1.0, -1.0),
            vec4(-1.0, -1.0, -1.0)
        ];
        
        var colors = [
            vec4(1.0, 0.0, 0.0, 1.0),
            vec4(0.0, 1.0, 0.0, 1.0),
            vec4(0.0, 0.0, 1.0, 1.0),
            vec4(0.0, 0.0, 0.0, 1.0),

            vec4(0.0, 0.0, 0.0, 1.0),
            vec4(1.0, 0.0, 0.0, 1.0),
            vec4(0.0, 1.0, 0.0, 1.0),
            vec4(0.0, 0.0, 1.0, 1.0),
        ];

        var indices = [
            1, 2, 3, // Front
            0, 1, 3,

            0, 3, 4, // Right
            5, 0, 4,

            3, 2, 7, // Bottom
            4, 3, 7,
            
            2, 1, 6, // Left
            7, 2, 6,

            1, 0, 5, // Top
            6, 0, 5,     
            
            4, 7, 6, // Back
            4, 5, 6


        ];

        this.cubeBuffer = new GLBuffer(this.bufferSize, this.gl.ELEMENT_ARRAY_BUFFER, this.gl);

        var offset = this.vertices.length;
        for(i in vertices)
        {
            this.AddVertex(vertices[i], colors[i])

        }

        for(i of indices)
        {
            this.cubeBuffer.Add(i + offset);
        }
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
      
        var cameraPosition = [0, 0, -5];


        var mv_matrix = mat4()
        mv_matrix = mult(mv_matrix, rotateX(-35.26))
        mv_matrix = mult(mv_matrix, rotateY(45))
        mv_matrix = mult(mv_matrix, scalem(0.5, 0.5, 0.5))
        //mv_matrix = mult(mv_matrix, rotateX(35, 26))
        //mv_matrix = mult(mv_matrix, rotateY(45))
        var mv = gl.getUniformLocation(this.program, "MV");
        gl.uniformMatrix4fv(mv, false, flatten(mv_matrix));


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

        this.DrawCube();
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

    OnClick : function()
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
                var vertexPosition = vec2(circleWidth * Math.cos(angle), circleWidth * Math.sin(angle)); 
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

    AddVertex : function(position, color)
    {
        vertexIndex = this.vertices.length;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec3']*vertexIndex, flatten([position]));
        this.vertices.push(position);

        colorIndex = this.colors.length;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec4'] * colorIndex, flatten([color]));
        this.colors.push(color);
        return vertexIndex;
    },
    Draw : function()
    {
        //this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.circleIndiceBuffer.Bind();
        this.gl.drawElements(this.gl.TRIANGLE_FAN, this.circleIndiceBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);
        this.triangleIndiceBuffer.Bind();
        this.gl.drawElements(this.gl.TRIANGLES, this.triangleIndiceBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);
        this.pointsIndiceBuffer.Bind();
        this.gl.drawElements(this.gl.POINTS, this.pointsIndiceBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);
        this.cubeBuffer.Bind();
        this.gl.drawElements(this.gl.LINE_STRIP, this.cubeBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);


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
