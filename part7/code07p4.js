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
        this.gl.activeTexture(this.gl.TEXTURE1)
        this.cubeTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubeTexture);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        bindLoc = this.gl.getUniformLocation(this.program, "tex");
        this.gl.uniform1i(bindLoc, 1);
    },
    LoadTexture(img)
    {
        this.gl.activeTexture(this.gl.TEXTURE0)
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        bindLoc = this.gl.getUniformLocation(this.program, "normMap");
        this.gl.uniform1i(bindLoc, 0);
    },
    CreateQuad(drawArray)
    {
        var depth = 0.999;
        verts = [
            vec4(-1.0, -1.0, depth, 1),
            vec4(1.0, -1.0, depth, 1),
            vec4(1.0, 1.0, depth, 1),

            vec4(1.0, 1.0, depth, 1),
            vec4(-1.0, 1.0, depth, 1),
            vec4(-1.0, -1.0, depth, 1)
        ];

        norms = Array(verts.length).fill(vec4(0.0, 0.0, 1.0, 0.0))
        drawArray.vertices = verts;
        drawArray.normals = norms;
        drawArray.Commit();
        return verts;
    },
    Run()
    {
        this.Setup();
        var gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.useProgram(this.program);
        
        this.SetPerspective(false);
        this.MVLocation = gl.getUniformLocation(this.program, "MV");
        this.PLocation  = gl.getUniformLocation(this.program, "P");
        this.EyeLocation = gl.getUniformLocation(this.program, "eye");
        this.ReflectivePosition = gl.getUniformLocation(this.program, "reflective");


        this.Mtex = gl.getUniformLocation(this.program, "Mtex");
        vPos = this.gl.getAttribLocation(this.program, "a_Position");
        this.gl.enableVertexAttribArray(vPos);
        vNorm = this.gl.getAttribLocation(this.program, "a_Normal");
        this.gl.enableVertexAttribArray(vNorm);

        this.quad = new DrawArray(this.gl, undefined, vPos, vNorm, 8*1024);
        this.CreateQuad(this.quad);
        this.circle = new DrawArray(this.gl, undefined, vPos, vNorm, 128*1024)
        this.DrawCircle();
        this.loadedTextures = 0; 

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
            var cubeImage = document.createElement('img');
            cubeImage.crossOrigin = 'anonymous';
            cubeImage.index = i;
            cubeImage.onload = function(event) {
                cubeImage = event.target;
                this.gl.activeTexture(this.gl.TEXTURE1)
                this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + cubeImage.index, 0, this.gl.RGB, gl.RGB, this.gl.UNSIGNED_BYTE, cubeImage);
                ++this.imageCount;
                if(this.imageCount == cubemap.length)
                    this.loadedTextures++;

            }.bind(this);
            cubeImage.src = cubemap[i];
        }
        var image = document.createElement('img');
        image.crossOrigin = 'anonymous';
        image.onload = function() {
            this.LoadTexture(image); 
            this.loadedTextures++;
        }.bind(this);
        image.src = "textures/normalmap.png"

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
        var pm = perspective(45, 3,  2, -2)
        var ort = ortho(-5, 5, -2, 2, -2, 200);

        if(orth)
        {
            this.P = ort;
        }
        else
        {
            this.P = pm; 
        }
    },

    Draw : function()
    {
        if(this.loadedTextures < 1)
        {
            window.requestAnimationFrame(function() {this.Draw()}.bind(this));
            return;
        }
        this.gl.clearColor(1.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        if(this.rotateCheckbox.checked)
        {
            this.rotation = (this.rotation + 0.5)%360;    
            this.rotationSlider.value = this.rotation;
        }
        var eye = vec3(3.0 * Math.sin(radians(this.rotation)), 0.0, 3.0 * Math.cos(radians(this.rotation)));
        //A 3.1
        MV = lookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0))        

        this.gl.uniform3fv(this.EyeLocation, flatten(eye));

        this.gl.uniform1i(this.ReflectivePosition, 0)
        Mvi = mult(MV, mat4());
        Mvi[0][3] = 0;
        Mvi[1][3] = 0;
        Mvi[2][3] = 0;
        Mvi = inverse(Mvi)
        Mvi[3][3] = 0;
        MtexM = mult(Mvi, inverse(this.P))
        this.gl.uniformMatrix4fv(this.Mtex, false, flatten(MtexM));
        this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(mat4()));
        this.gl.uniformMatrix4fv(this.PLocation, false, flatten(mat4()))
        this.quad.Bind();
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.quad.vertices.length);

        this.gl.uniform1i(this.ReflectivePosition, 1)
        this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
        this.gl.uniformMatrix4fv(this.PLocation, false, flatten(this.P))
        this.gl.uniformMatrix4fv(this.Mtex, false, flatten(mat4()))
        this.circle.Bind();
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.circle.vertices.length)
         
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
