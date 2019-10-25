const ObjPath = "../Sattelite.obj";
const MatPath = "../Sattelite.mtl";


var Renderer = {
    
    /**
     * @type {WebGLRenderingContext}
     */
    gl : null,
    bufferSize : 32*1024,
    clearColor : vec4(1, 0, 0, 1),
    drawColor : vec4(0, 0, 0, 1),

    SetupSliders()
    {
        var sliders = {
            ambient : "Ambiance",
            diffuse : "Diffuse",
            specular : "Specular",
            shininess : "Shininess",
            emission : "Emission"
        }

        for(v in sliders)
        {
            slider = document.getElementById(sliders[v]) 
            this[v] = new SliderValue(slider)
        }
    },

    async LoadModel()
    {
        var modelLoader = new OBJDoc(ObjPath); 
        response = await fetch(ObjPath, {mode : 'no-cors'});

        var data = await response.text();
        if(modelLoader.parse(data, 1.0, false))
        {
            this.drawInfo = modelLoader.getDrawingInfo();
        }
        else
        {
            console.error("Failed to load model");
        }
    },

    OnModelLoaded()
    {
        var vertexCount = this.drawInfo.vertices.length;
        this.buffers = new DrawElements(this.gl, this.vCol, this.vPos, this.vNorm, vertexCount, this.drawInfo.indices.length); 
        this.buffers.vertices = this.drawInfo.vertices;
        this.buffers.normals = this.drawInfo.normals;
        this.buffers.colors = this.drawInfo.colors;
        this.buffers.indices = this.drawInfo.indices;
        this.modelLoaded = true;
        console.log("Loaded " + vertexCount + " vertices from model");
        console.log("Vertices:")
        console.log(this.buffers.vertices);
        console.log("Normals:")
        console.log(this.buffers.normals);
        console.log("Colors:")
        console.log(this.buffers.colors);
        console.log("Indices:")
        console.log(this.buffers.indices);
        console.log("Indices:")

        this.buffers.Commit();
    },

    

    Setup()
    {
        this.canvas = document.getElementById("c");
        this.mode = document.getElementById("modePicker");
        // Rotation settings
        this.LoadModel();
        this.rotateCheckbox = document.getElementById("rotate");
        this.rotation = 0;
        this.rotationSlider = document.getElementById("rotation");
        this.rotationSlider.oninput = function(e) {
                this.rotation = this.rotationSlider.value;
        }.bind(this);

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
        gl.enable(gl.CULL_FACE);
        gl.useProgram(this.program);

        this.vPos = gl.getAttribLocation(this.program, "a_Position");
        gl.vertexAttribPointer(this.vPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vPos);
      
        this.vCol = gl.getAttribLocation(this.program, "a_Color");
        gl.vertexAttribPointer(this.vCol, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vCol);
    
        this.vNorm = gl.getAttribLocation(this.program, "a_Normal")
        gl.vertexAttribPointer(this.vNorm, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vNorm);

        this.MVLocation = gl.getUniformLocation(this.program, "MV")
        
        this.SetPerspective(true);
        
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
    },

    OnClick : function()
    {
        var boundingRect = event.target.getBoundingClientRect();
        var pos = subtract(vec2(event.x, event.y), vec2(boundingRect.left, boundingRect.top));
        var offset = vec2(boundingRect.width*0.5, boundingRect.height*0.5);
        
        var centeredPos = subtract(pos, offset);
        var z = 1 - 2*((this.vertices.length + 1) / this.bufferSize);
        var normalizedPos = vec3(centeredPos[0] / (0.5*boundingRect.width), -centeredPos[1] / (0.5*boundingRect.height), z);
    },

    SetPerspective : function(orth)
    {
        var mv = this.gl.getUniformLocation(this.program, "P");
        var pm = perspective(45, 3,  0.1, 100)
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
        //this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        if(this.rotateCheckbox.checked)
        {
            this.rotation = (this.rotation + 0.5)%360;    
            this.rotationSlider.value = this.rotation;
        }

        if(typeof this.drawInfo != 'undefined' && !this.modelLoaded)
        {
            this.OnModelLoaded();
        }

        if(!this.modelLoaded)
        {
            window.requestAnimationFrame(function() {this.Draw()}.bind(this));
            return;
        }


        var MVs = [
                    mult(translate(0, 0, -1), mult(scalem(1.0, 1.0, 1.0), rotate(this.rotation, vec3(0, 1, 0))))
                  ]
        
        this.buffers.Bind();
        for(MV of MVs)
        {
           this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
           var elementCount = this.buffers.indices.length
           //this.gl.drawArrays(this.gl.TRIANGLES, 0, this.buffers.vertices.length) 
           this.gl.drawElements(this.gl.TRIANGLES, elementCount, this.gl.UNSIGNED_SHORT, 0);
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
