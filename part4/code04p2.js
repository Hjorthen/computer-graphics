var Renderer = {
    
    /**
     * @type {WebGLRenderingContext}
     */
    gl : null,
    bufferSize : 32*1024,
    clearColor : vec4(1, 0, 0, 1),
    drawColor : vec4(0, 0, 0, 1),

    Setup()
    {
        this.canvas = document.getElementById("c");
        this.mode = document.getElementById("modePicker");
        // Rotation settings
        this.rotateCheckbox = document.getElementById("rotate");
        this.rotation = 0;
        this.rotationSlider = document.getElementById("rotation");
        this.rotationSlider.onmousemove = function(e) {
            if(e.button == 0)
                this.rotation = this.rotationSlider.value;}.bind(this);

        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
        this.subdivisionLevel = subdivisonSlider.value;
        this.material = {
            ambient : vec4(1.0, 0.0, 1.0, 1.0),
            diffuse : vec4(1.0, 0.8, 0.0, 1.0),
            specular : vec4(1.0, 0.8, 0.0, 1.0),
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

        var vPos = gl.getAttribLocation(this.program, "a_Position");
        gl.enableVertexAttribArray(vPos);
         
        this.MVLocation = gl.getUniformLocation(this.program, "MV")
        
        this.SetPerspective(true);
         
        var vNorm = gl.getAttribLocation(this.program, "a_Normal")
        gl.enableVertexAttribArray(vNorm);

        this.circle = new DrawArray(this.gl, undefined, vPos, vNorm, 128*1024)
        
        var light = Light(vec4(0.0, 0.0, 0.0, 1),
                          vec4(1.0, 1.0, 1.0, 0), 
                          vec4(0.0, 0.0, 0.0, 0), 
                          vec4(0.0, 0.0, -1.0, 0));
        var colorMatrix = light.ColorMatrix();
        var materialPos = gl.getUniformLocation(this.program, "lightProperties")
        this.gl.uniformMatrix4fv(materialPos, false, flatten(colorMatrix));

        var lightPos = gl.getUniformLocation(this.program, "lightPosition");
        this.gl.uniform4fv(lightPos, flatten(light.position));
        
        this.DrawCircle();

        this.dotCounter = 0;
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
    DrawCircle()
    {
        this.circle.Clear()

        this.circle = UnitSphere(this.subdivisionLevel, this.circle) 
        this.circle.Commit()
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

        var MVs = [
                   //mult(translate(0, 0, -10), mult(rotateX(-20.0), rotateY(45))), 
                    mult(translate(0, 0, -10), rotate(this.rotation, vec3(0, 1, 0)))
                  ]
        
        this.circle.Bind();

        for(MV of MVs)
        {
           this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
           this.gl.drawArrays(this.gl.TRIANGLES, 0, this.circle.vertices.length)
            console.log("Drawing " + this.circle.vertices.length + " vertices");
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

subdivisonSlider =  document.getElementById("subdivSlider")
subdivisonSlider.addEventListener("change", function()
    {
        Renderer.subdivisionLevel = Number(subdivisonSlider.value);
        Renderer.DrawCircle()
    }
);

onload= Renderer.Run();
