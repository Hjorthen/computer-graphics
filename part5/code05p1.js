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

    Setup()
    {
        this.SetupSliders();
        this.canvas = document.getElementById("c");
        this.mode = document.getElementById("modePicker");
        // Rotation settings
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

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferSize, gl.STATIC_DRAW);
        var vPos = gl.getAttribLocation(this.program, "a_Position");
        gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
        this.vertices = [];
      
        this.MVLocation = gl.getUniformLocation(this.program, "MV")
        this.shininessLocation = gl.getUniformLocation(this.program, "shininess")
        this.MVNormLocation = gl.getUniformLocation(this.program, "MVNorm")
        
        this.SetPerspective(true);

        this.colors = [];
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferSize, gl.STATIC_DRAW);
        var vCol = gl.getAttribLocation(this.program, "a_Color");
        gl.vertexAttribPointer(vCol, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vCol);
    
        var vNorm = gl.getAttribLocation(this.program, "a_Normal")
        gl.vertexAttribPointer(vNorm, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNorm);

        this.circle = new DrawArray(this.gl, vCol, vPos, vNorm, 128*1024)
        
        this.light = Light(vec4(1.0, 1.0, 1.0, 1.0),
                          vec4(1.0, 1.0, 1.0, 1.0), 
                          vec4(1.0, 1.0, 1.0, 0), 
                          vec4(0.0, 0.0, 5.0, 1.0));
        this.materialPos = gl.getUniformLocation(this.program, "lightProperties")

        this.lightPos = gl.getUniformLocation(this.program, "lightPosition");

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
        //this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        if(this.rotateCheckbox.checked)
        {
            this.rotation = (this.rotation + 0.5)%360;    
            this.rotationSlider.value = this.rotation;
        }

        var ambientProduct = mult(scale(this.ambient.value, this.material.ambient), scale(this.emission.value, this.light.ambient));
        var diffuseProduct = mult(scale(this.diffuse.value, this.material.diffuse), scale(this.emission.value, this.light.diffuse));
        var specularProduct = mult(scale(this.specular.value, this.material.specular), scale(this.emission.value, this.light.specular));
        
        // Transpose because GL is column-major
        var lightingMatrix = transpose(mat4(ambientProduct, diffuseProduct, specularProduct, vec4()))

        this.gl.uniformMatrix4fv(this.materialPos, false, flatten(lightingMatrix));
        this.gl.uniform1f(this.shininessLocation, this.shininess.value);
        
        var MVs = [
                    mult(translate(0, 0, -10), rotate(this.rotation, vec3(0, 1, 0)))
                  ]
        
        this.circle.Bind();

        for(MV of MVs)
        {
           var transformedLightPosition = mult(MV, this.light.position);
           transformedLightPosition[3] = 1;
           this.gl.uniform4fv(this.lightPos, flatten(transformedLightPosition));
           this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
           var MVNorm = normalMatrix(MV, true);
           this.gl.uniformMatrix3fv(this.MVNormLocation, false, flatten(MVNorm))
           this.gl.drawArrays(this.gl.TRIANGLES, 0, this.circle.vertices.length)
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
