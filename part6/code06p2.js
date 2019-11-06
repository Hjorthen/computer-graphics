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

    SetupSelect()
    {
        for(s of document.getElementsByTagName("select"))
        {
            var thisProxy = this;
            this[s.id] = s.selectedIndex;
            s.addEventListener('change', function()
                {
                    thisProxy[this.id] = this.selectedIndex;
                    thisProxy[this.id + "Changed"](this.selectedIndex);
                }
            )
        }
    },
    filterModeChanged(selection)
    {
        var gl = this.gl;
        var filters = [
            ["Nearest", gl.NEAREST], 
            ["Linear", gl.LINEAR],
            ["Nearest-Mipmap-Nearest", gl.NEAREST_MIPMAP_NEAREST],
            ["Linear-Mipmap-Nearest", gl.LINEAR_MIPMAP_NEAREST],
            ["Linear-Mipmap-Linear", gl.LINEAR_MIPMAP_LINEAR],
            ["Nearest-Mipmap-Linear", gl.NEAREST_MIPMAP_LINEAR]
        ]
        var settings = filters[selection];
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, settings[1]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, settings[1]);
        console.log("Switched to " + settings[0]);
    },
    wrapModeChanged(selection)
    {
        var gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if(selection === 0)
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            console.log("Switched to repeat");
        }
        else
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            console.log("Switched to clamp");
        }

    },
    Setup()
    {
        this.SetupSelect();
        this.canvas = document.getElementById("c");
        
        // Rotation settings
        this.rotation = 0.0;
        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
        
    },

    GetDrawMode()
    {
        return this.mode.selectedIndex + 1; 
    },
    
    SetupQuad()
    {
        /*
         * -4, -21 -----------  4, -21
         *        |          |
         *        |          |
         *        |/         |
         * -4, -1 ------------  4, -1
         */
        this.vertices = [
            vec3(4, -1, -1),
            vec3(4, -1, -21),
            vec3(-4, -1, -1),
            vec3(-4, -1,  -21)];
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.vertices), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.vPos, 3, this.gl.FLOAT, false, 0, 0);

        this.texels = [
            vec2(2.5, 0.0),
            vec2(2.5, 10.0),
            vec2(-1.5, 0.0),
            vec2(-1.5, 10.0)
        ];

        this.texelBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texelBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.texels), this.gl.STATIC_DRAW);
        
        this.tPos = this.gl.getAttribLocation(this.program, "a_Texel");
        this.gl.vertexAttribPointer(this.tPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.tPos);
    },

    Run()
    {
        this.Setup();
        var gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.useProgram(this.program);

        var texSize = 64;
        var numRows = 8;
        var numCols = 8;
        var myTexels = new Uint8Array(4*texSize*texSize);
        for (var i = 0; i < texSize; ++i) {
            for (var j = 0; j < texSize; ++j) {
                var patchx = Math.floor(i/(texSize/numRows));
                var patchy = Math.floor(j/(texSize/numCols));
                var c = (patchx%2 !== patchy%2 ? 255 : 0);
                myTexels[4*i*texSize+4*j] = c;
                myTexels[4*i*texSize+4*j+1] = c;
                myTexels[4*i*texSize+4*j+2] = c;
                myTexels[4*i*texSize+4*j+3] = 255;
            }
        }
        
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        var tex = gl.getUniformLocation(this.program, "myTexture");
        gl.uniform1i(tex, 0);
        

        this.vPos = gl.getAttribLocation(this.program, "a_Position");
        gl.vertexAttribPointer(this.vPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vPos);

        this.SetupQuad();
      
        this.MVLocation = gl.getUniformLocation(this.program, "MV")
        
        this.SetPerspective(false);

        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },

    SetPerspective : function(orth)
    {
        var mv = this.gl.getUniformLocation(this.program, "P");
        var pm = perspective(45, 3,  0.2, 200)
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
        this.gl.clearColor(0, 0, 1, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        var MVs = [
                    //mult(translate(0, 0, 0), mult(scalem(1.0, 1.0, 1.0), rotate(this.rotation, vec3(0, 1, 0))))
                  lookAt(vec3(0.0, 0.0, 0.5), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0))  
                  ]
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        for(MV of MVs)
        {
           this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
           this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertices.length) 
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
