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
      
        this.MVLocation = gl.getUniformLocation(this.program, "MV")
        
        this.SetPerspective(true);
        this.colors = [];
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferSize, gl.STATIC_DRAW);
        var vCol = gl.getAttribLocation(this.program, "a_Color");
        gl.vertexAttribPointer(vCol, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vCol);

        this.DrawCube();
        
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
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

    SetPerspective : function(orth)
    {
        var mv = this.gl.getUniformLocation(this.program, "P");
        var pm = perspective(45, 3,  2, -2)
        var ort = ortho(-5, 5, -2, 2, -2, 200);

        if(orth)
        {
            this.gl.uniformMatrix4fv(mv, false, flatten(ort));
            console.log("Switched to ortographic view")
        }
        else
        {
            this.gl.uniformMatrix4fv(mv, false, flatten(pm));
            console.log("Switched to perspective view")
        }
    },

    Draw : function()
    {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.cubeBuffer.Bind();
        
        var MVs = [
                   translate(-3, 0, -10),
                   mult(translate(0, 0, -10), rotateY(45)), 
                   mult(translate(3, 0, -10) , mult(rotateX(-35.26), rotateY(45)))
                  ]

        for(MV of MVs)
        {
            this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
            this.gl.drawElements(this.gl.LINE_STRIP, this.cubeBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);
        }


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

perspectiveMenu = document.getElementById("perspective")
perspectiveMenu.addEventListener("change", function() {
    switch(perspectiveMenu.selectedIndex)
    {
        case 0:
            Renderer.SetPerspective(true);
            break;
        case 1:
            Renderer.SetPerspective(false);
            break;
    }
});

onload= Renderer.Run();
