const ObjPath = "teapot.obj";

function PrintTransform(v, m)
{
    let vp = v.slice();
    for(i=0;i<v.length;++i)
    {
        vp[i] = mult(m, v[i]);
    }
    console.log(vp);
}
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

        this.moveCheckbox = document.getElementById("Move");
        this.heightOffset = 0;
        this.heightSlider = document.getElementById("Height");

        this.heightSlider.oninput = function(e)
        {
            this.heightOffset = this.heightSlider.value;
        }.bind(this);

        this.rotationSlider.oninput = function(e) {
                this.rotation = this.rotationSlider.value;
        }.bind(this);

        this.gl = setupWebGL(this.canvas);
        this.groundProgram = initShaders(this.gl, "vertex-shader", "fragment-shader");
        this.teacupProgram = initShaders(this.gl, "vertex-shader-teacup", "fragment-shader-teacup");
        this.getShaderParameters();
        this.LoadModel();
    },
    GetQuad()
    {
        var quad = {}
        quad.vertices = [
            vec4(-1.0, -1.0, 0.0, 1.0),
            vec4( 1.0, -1.0, 0.0, 1.0),
            vec4( 1.0,  1.0, 0.0, 1.0),

            vec4( 1.0,  1.0, 0.0, 1.0),
            vec4(-1.0,  1.0, 0.0, 1.0),
            vec4(-1.0, -1.0, 0.0, 1.0)
        ];

        quad.uvs = [
             vec2(0.0, 0.0),
             vec2(1.0, 0.0),
             vec2(1.0, 1.0),

             vec2(1.0, 1.0),
             vec2(0.0, 1.0),
             vec2(0.0, 0.0)
        ]

        return quad;
    },
    Commit(obj)
    {
        // Key-value pairs of the objects to upload
        buffers = {
            vPos : {
                name : 'vertices',
            },
            vUV :  {
                name : 'uvs',
            },
            vColor : {
                name : 'colors',
                size : 4
            },
            indices : {
                 name : 'indices',
                 size : 4
            }
        };

        for(let [key, value] of Object.entries(buffers))
        {
            if(typeof obj[value.name] != 'undefined')
            {
                let bufferName = value.name + 'Buffer';
                if(typeof obj[bufferName] == 'undefined')
                    obj[bufferName] = this.gl.createBuffer();
                 
                if(value.name === "indices")
                {
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj[bufferName]);
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, obj[value.name], this.gl.STATIC_DRAW)
                }
                else
                {
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj[bufferName]);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(obj[value.name]), this.gl.STATIC_DRAW)
                }

            }
        }
    },
    Bind(obj, attribs)
    {
        buffers = {
            vPos : {
                name :  'vertices',
                size : 4
            },
            vUV : {
                name : 'uvs',
                size : 2
            },
            vColor : {
                name : 'colors',
            },
            indices : {
                 name : 'indices',
                 size : 4
            }
        };

        for(let [key, value] of Object.entries(buffers))
        {
            let bufferName = value.name + 'Buffer';
            if((value.name == "indices" || typeof attribs[key] != 'undefined') && typeof obj[bufferName] != 'undefined')
            {
                if(value.name === "indices")
                {
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj[bufferName])
                }
                else
                {
                   // default size
                   let size = value.size;
                   if(typeof obj[value.name + "Size"] != 'undefined')
                        size = obj[value.name + "Size"];
                   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj[bufferName])
                   this.gl.vertexAttribPointer(attribs[key], size, this.gl.FLOAT, false, 0, 0);
                   this.gl.enableVertexAttribArray(attribs[key])
                }
            }
        }
    },
    CreateTextures()
    {
        this.textureLoaded = false;
        let gl = this.gl;
        this.groundTexture = gl.createTexture();
        this.groundTextureId = gl.TEXTURE0;
        
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.groundTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        let image = document.createElement('img');
        image.crossOrigin = 'anonymous';
        image.onload = function(event) {
             gl.activeTexture(this.groundTextureId);
             gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, event.target);
             this.textureLoaded = true; 
        }.bind(this)
        image.src = "./xamp23.png";   
        
        this.objectTexture = gl.createTexture();
        this.objectTextureId = gl.TEXTURE1;
        gl.activeTexture(this.objectTextureId)
        gl.bindTexture(gl.TEXTURE_2D, this.objectTexture);
         
        let texelData = new Uint8Array([255, 0, 0]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, texelData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        this.shadowTexture = gl.createTexture();
        this.shadowTextureId = gl.TEXTURE2;
        gl.activeTexture(this.shadowTextureId);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture);
        texelData = new Uint8Array([0, 0, 0, 256 * 0.7]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texelData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    },
    Run()
    {
        this.Setup();
        var gl = this.gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.useProgram(this.groundProgram);
        
        this.SetPerspective(false);

        this.groundPlane = this.GetQuad();
        var groundTransform = mult(translate(0, -1, -5), mult(scalem(2, 1, 4), rotateX(-90)))
        // Transform the quad vertices to the right orientation
        for(i=0;i<this.groundPlane.vertices.length;++i)
        {
           this.groundPlane.vertices[i] = mult(groundTransform, this.groundPlane.vertices[i]); 
        }
        this.Commit(this.groundPlane);

        this.CreateTextures();
        this.LoadModel();
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
    getShaderParameters()
    {
        this.groundProgram.vPos = this.gl.getAttribLocation(this.groundProgram, "a_Position");
        this.teacupProgram.vPos = this.gl.getAttribLocation(this.teacupProgram, "a_Position");

        this.groundProgram.vUV = this.gl.getAttribLocation(this.groundProgram, "a_UV");

        this.groundProgram.MVLocation = this.gl.getUniformLocation(this.groundProgram, "MV")
        this.teacupProgram.MVLocation = this.gl.getUniformLocation(this.teacupProgram, "MV")

        this.groundProgram.PLocation = this.gl.getUniformLocation(this.groundProgram, "P")
        this.teacupProgram.PLocation = this.gl.getUniformLocation(this.teacupProgram, "P")

        this.groundProgram.textureUniform = this.gl.getUniformLocation(this.groundProgram, "colorTexture")

    },
    async LoadModel()
    {
        var modelLoader = new OBJDoc(ObjPath); 
        response = await fetch(ObjPath, {mode : 'no-cors'});

        var data = await response.text();
        if(modelLoader.parse(data, 0.25, false))
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
        this.model = {}
        this.model.vertices = this.drawInfo.vertices;
        this.model.verticesSize = 3;
        this.model.colors = this.drawInfo.colors;
        this.model.indices = this.drawInfo.indices;

        console.log("Loaded " + this.model.vertices.length + " vertices from model");
        this.Commit(this.model);
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
        if(typeof this.drawInfo == 'undefined' || !this.textureLoaded)
        {
            this.gl.clearColor(1.0, 0.0, 0.0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            window.requestAnimationFrame(function() {this.Draw()}.bind(this));
            return;
        }
        else if(typeof this.model == 'undefined')
        {
            this.OnModelLoaded();
        }

        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        if(this.rotateCheckbox.checked)
        {
            this.rotation = (this.rotation + 0.5)%360;    
            this.rotationSlider.value = this.rotation;
        }

        if(this.moveCheckbox.checked)
        {
            this.heightOffset = this.heightOffset + 0.01;
            if(this.heightOffset > 1)
                this.heightOffset = -1;
        }
        MV = lookAt(vec3(0, 0, 1), vec3(0, 0, -3), vec3(0, 1, 0))


        this.gl.depthFunc(this.gl.LESS);
        // Draw the plane
        this.gl.useProgram(this.groundProgram);
        this.gl.uniformMatrix4fv(this.groundProgram.MVLocation, false, flatten(MV));
        this.gl.uniformMatrix4fv(this.groundProgram.PLocation, false, flatten(this.P))
        this.gl.uniform1i(this.textureUniform, 0);
        this.Bind(this.groundPlane, this.groundProgram);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.groundPlane.vertices.length)


        this.gl.useProgram(this.teacupProgram);
        let modelMatrix = translate(0, this.heightOffset, -3)
        this.gl.uniform1i(this.textureUniform, 2);
        let lightPos = vec3(2.0 * Math.sin(radians(this.rotation)), 2, 2.0 * Math.cos(radians(this.rotation)) -2); 
        let shadowProjectMatrix = mat4();
        shadowProjectMatrix[3][3] = 0.0;
        shadowProjectMatrix[3][1]= -1.0/(lightPos[1] - -1.0);
        let lightTranslation = translate(lightPos[0], lightPos[1], lightPos[2]);
        let shadowMatrix = mult(MV, lightTranslation)
        shadowMatrix = mult(shadowMatrix, shadowProjectMatrix)
        shadowMatrix = mult(shadowMatrix, inverse(lightTranslation));
        shadowMatrix = mult(shadowMatrix, modelMatrix)

        // Draw Shadows
        this.gl.depthFunc(this.gl.GREATER);
        this.gl.uniformMatrix4fv(this.teacupProgram.PLocation, false, flatten(mult(translate(0, 0, 0.5), this.P)))
        this.gl.uniformMatrix4fv(this.teacupProgram.MVLocation, false, flatten(shadowMatrix));
        this.Bind(this.model, this.teacupProgram)
        this.gl.drawElements(this.gl.TRIANGLES, this.model.indices.length, this.gl.UNSIGNED_SHORT, 0);
        
        // Draw objects
        this.gl.depthFunc(this.gl.LESS);
        this.gl.uniformMatrix4fv(this.teacupProgram.PLocation, false, flatten(this.P))
        this.gl.uniformMatrix4fv(this.teacupProgram.MVLocation, false, flatten(mult(modelMatrix, MV)));
        this.Bind(this.model, this.teacupProgram);
        this.gl.drawElements(this.gl.TRIANGLES, this.model.indices.length, this.gl.UNSIGNED_SHORT, 0);
         
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
}


/* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
  return WebGLUtils.setupWebGL(canvas, { alpha: false });
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
