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
        this.rotationSlider.oninput = function(e) {
                this.rotation = this.rotationSlider.value;
        }.bind(this);

        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
        this.subdivisionLevel = subdivisonSlider.value;
    },
    LoadTexture(img)
    {
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        bindLoc = this.gl.getUniformLocation(this.program, "earth");
        this.gl.uniform1i(bindLoc, 0);
    },
    Run()
    {
        this.Setup();
        var gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.useProgram(this.program);
        
        this.SetPerspective(false);
        var light = Light(vec4(0.4, 0.4, 0.4, 1),
                          vec4(1.0, 1.0, 1.0, 0), 
                          vec4(0.0, 0.0, 0.0, 0), 
                          vec4(0.0, 0.0, -1.0, 0));
        var colorMatrix = light.ColorMatrix();
        var materialPos = gl.getUniformLocation(this.program, "lightProperties")
        this.gl.uniformMatrix4fv(materialPos, false, flatten(colorMatrix));

        var lightPos = gl.getUniformLocation(this.program, "lightPosition");
        this.gl.uniform4fv(lightPos, flatten(light.position));
        this.MVLocation = gl.getUniformLocation(this.program, "MV");
        vPos = this.gl.getAttribLocation(this.program, "a_Position");
        this.gl.enableVertexAttribArray(vPos);
        vNorm = this.gl.getAttribLocation(this.program, "a_Normal");
        this.gl.enableVertexAttribArray(vNorm);

        this.circle = new DrawArray(this.gl, undefined, vPos, vNorm, 128*1024)
        this.DrawCircle();

        var image = document.createElement('img');
        image.crossOrigin = 'anonymous';
        image.onload = function() {
            this.LoadTexture(image); 
            window.requestAnimationFrame(function() {this.Draw()}.bind(this));
        }.bind(this);
        image.src = "earth.jpg"

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
                    mult(translate(0, 0, -3), rotate(this.rotation, vec3(0, 1, 0)))
                  ]
        
        this.circle.Bind();

        for(MV of MVs)
        {
           this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
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
