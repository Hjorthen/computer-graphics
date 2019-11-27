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
    CreateTexture()
    {
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        bindLoc = this.gl.getUniformLocation(this.program, "tex");
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
        var cubemap = ['textures/cm_left.png',    // POSITIVE_X 
                       'textures/cm_right.png',   // NEGATIVE _X 
                       'textures/cm_top.png',     // POSITIVE _Y 
                       'textures/cm_bottom.png',  // NEGATIVE _Y 
                       'textures/cm_back.png',    // POSITIVE _Z 
                       'textures/cm_front.png'];  // NEGATIVE _Z 
        this.CreateTexture();
        // Used to begin rendering once all images has been loaded
        this.imageCount = 0;
        for(i=0;i<cubemap.length;++i)
        {
            var image = document.createElement('img');
            image.crossOrigin = 'anonymous';
            image.index = i;
            image.onload = function(event) {
                image = event.target;
                console.log(image)
                console.log(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + image.index);
                this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + image.index, 0, this.gl.RGB, gl.RGB, this.gl.UNSIGNED_BYTE, image);
                ++this.imageCount;
                if(this.imageCount == cubemap.length)
                    window.requestAnimationFrame(function() {this.Draw()}.bind(this));

            }.bind(this);
            image.src = cubemap[i];
        }

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

subdivisonSlider =  document.getElementById("subdivSlider")
subdivisonSlider.addEventListener("change", function()
    {
        Renderer.subdivisionLevel = Number(subdivisonSlider.value);
        Renderer.DrawCircle()
    }
);

onload= Renderer.Run();
