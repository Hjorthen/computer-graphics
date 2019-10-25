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
        this.buffers = new DrawElements(this.gl, undefined, this.vPos, this.vNorm, vertexCount, this.drawInfo.indices.length); 
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
        this.SetupSliders();

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
        
        this.material = {
            ambient : vec4(1.0, 1.0, 1.0, 1.0),
            diffuse : vec4(1.0, 1.0, 1.0, 1.0),
            specular : vec4(1.0, 1.0, 1.0, 1.0),
            shininess : 100.0,
            emission : vec4(0.0, 0.3, 0.3, 1.0)
        }
        this.light = Light(vec4(1.0, 1.0, 1.0, 1.0),
                          vec4(1.0, 1.0, 1.0, 1.0), 
                          vec4(1.0, 1.0, 1.0, 0), 
                          vec4(0.0, 0.0, 5.0, 1.0));
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
      
        this.vNorm = gl.getAttribLocation(this.program, "a_Normal")
        gl.vertexAttribPointer(this.vNorm, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vNorm);

        this.MVLocation = gl.getUniformLocation(this.program, "MV")
        this.shininessLocation = gl.getUniformLocation(this.program, "shininess")
         
        this.materialPos = gl.getUniformLocation(this.program, "lightProperties")
        this.lightPos = gl.getUniformLocation(this.program, "lightPosition");

        this.SetPerspective(true);
        
        this.dotCounter = 0;
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
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


        var ambientProduct = mult(scale(this.ambient.value, this.material.ambient), scale(this.emission.value, this.light.ambient));
        var diffuseProduct = mult(scale(this.diffuse.value, this.material.diffuse), scale(this.emission.value, this.light.diffuse));
        var specularProduct = mult(scale(this.specular.value, this.material.specular), scale(this.emission.value, this.light.specular));
        
        // Transpose because GL is column-major
        var lightingMatrix = transpose(mat4(ambientProduct, diffuseProduct, specularProduct, vec4()))

        this.gl.uniformMatrix4fv(this.materialPos, false, flatten(lightingMatrix));
        this.gl.uniform1f(this.shininessLocation, this.shininess.value);

        var MVs = [
                    mult(translate(0, 0, -0.5), mult(scalem(1.0, 1.0, 1.0), rotate(this.rotation, vec3(0, 1, 0))))
                  ]
        
        this.buffers.Bind();
        for(MV of MVs)
        {
           var transformedLightPosition = mult(MV, this.light.position);
           transformedLightPosition[3] = 1;
           this.gl.uniform4fv(this.lightPos, flatten(transformedLightPosition));

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
