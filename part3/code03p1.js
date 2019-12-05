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
        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
        this.drawMode = this.gl.LINE_STRIP;
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

        var mv_matrix = mat4()
        mv_matrix = mult(mv_matrix, rotateX(-35.26))
        mv_matrix = mult(mv_matrix, rotateY(45))
        mv_matrix = mult(mv_matrix, scalem(0.5, 0.5, 0.5))
        var mv = gl.getUniformLocation(this.program, "MV");
        gl.uniformMatrix4fv(mv, false, flatten(mv_matrix));

        this.DrawCube();
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },

    AddVertex : function(position, color)
    {
        vertexIndex = this.vertices.length;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, sizeof['vec3']*vertexIndex, flatten([position]));
        this.vertices.push(position);
        return vertexIndex;
    },
    Draw : function()
    {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.cubeBuffer.Bind();
        this.gl.drawElements(this.drawMode, this.cubeBuffer.Size(), this.gl.UNSIGNED_BYTE, 0);


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

function toggleWireframe() {
    if(Renderer.drawMode == Renderer.gl.LINE_STRIP)
    {
        Renderer.drawMode = Renderer.gl.TRIANGLE_FAN;
    }
    else
    {
        Renderer.drawMode = Renderer.gl.LINE_STRIP;
    }
}

onload= Renderer.Run();
