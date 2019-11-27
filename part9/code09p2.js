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
        // Load Programs
        this.groundProgram = initShaders(this.gl, "vertex-shader", "fragment-shader");
        this.teacupProgram = initShaders(this.gl, "vertex-shader-teacup", "fragment-shader-teacup");
        this.shadowProgram = initShaders(this.gl, "vertex-shader-shadowmap", "fragment-shader-shadowmap");
        this.getShaderParameters();
        this.setupLightParameters();
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
            },
            vNorm : {
                name: "normals",
                size : 3
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
            },
            vNorm : {
                name: "normals",
                size : 3
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
    initFrameBufferObject(gl, width, height)
    {
        var framebuffer = gl.createFramebuffer(); 
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); 
        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        var shadowMap = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1); 
        gl.bindTexture(gl.TEXTURE_2D, shadowMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        framebuffer.texture = shadowMap;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer object is incomplete: ' + status.toString()); }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        framebuffer.width = width;
        framebuffer.height = height;
        return framebuffer;
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
        var groundTransform = mult(translate(0, -1, -3), mult(scalem(2, 1, 2), rotateX(-90)))
        // Transform the quad vertices to the right orientation
        for(i=0;i<this.groundPlane.vertices.length;++i)
        {
           this.groundPlane.vertices[i] = mult(groundTransform, this.groundPlane.vertices[i]); 
        }
        this.Commit(this.groundPlane);

        this.CreateTextures();
        this.LoadModel();
        this.shadowFramebuffer = this.initFrameBufferObject(this.gl, 512, 512)
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
    setupLightParameters()
    {
        this.ambientScale = 0.1;
        this.diffuseScale = 0.5;
        this.specularScale = 0.4;
        this.shininess = 50;
    },
    getShaderParameters()
    {
        this.groundProgram.vPos = this.gl.getAttribLocation(this.groundProgram, "a_Position");
        this.teacupProgram.vPos = this.gl.getAttribLocation(this.teacupProgram, "a_Position");

        this.groundProgram.vUV = this.gl.getAttribLocation(this.groundProgram, "a_UV");

        this.groundProgram.MVLocation = this.gl.getUniformLocation(this.groundProgram, "MV")
        this.teacupProgram.MLocation = this.gl.getUniformLocation(this.teacupProgram, "M")
        this.teacupProgram.VLocation = this.gl.getUniformLocation(this.teacupProgram, "V")

        this.groundProgram.PLocation = this.gl.getUniformLocation(this.groundProgram, "P")
        this.teacupProgram.PLocation = this.gl.getUniformLocation(this.teacupProgram, "P")

        this.groundProgram.colorWeightUniform = this.gl.getUniformLocation(this.groundProgram, "colorTexture");
        this.groundProgram.textureUniform = this.gl.getUniformLocation(this.groundProgram, "colorTexture")

        this.teacupProgram.lightPosition = this.gl.getUniformLocation(this.teacupProgram, "lightPosition");
        this.teacupProgram.normMatrixLocation = this.gl.getUniformLocation(this.teacupProgram, "normMatrix")
        this.teacupProgram.ambienceLocation = this.gl.getUniformLocation(this.teacupProgram, "ambience");
        this.teacupProgram.diffuseLocation = this.gl.getUniformLocation(this.teacupProgram, "diffuse");
        this.teacupProgram.specularLocation = this.gl.getUniformLocation(this.teacupProgram, "specular");
        this.teacupProgram.shininessLocation = this.gl.getUniformLocation(this.teacupProgram, "shininess");
        this.teacupProgram.vNorm = this.gl.getAttribLocation(this.teacupProgram, "a_Normal");
        this.shadowProgram.MVPLocation = this.gl.getUniformLocation(this.shadowProgram, "MVP")
        this.shadowProgram.vPos = this.gl.getAttribLocation(this.shadowProgram, "a_Position");

        this.groundProgram.shadowMapLocation = this.gl.getUniformLocation(this.groundProgram, "shadowMap");
        this.teacupProgram.shadowMapLocation = this.gl.getUniformLocation(this.teacupProgram, "shadowMap");
        this.teacupProgram.lightMVPLocation = this.gl.getUniformLocation(this.teacupProgram, "lightMVP");
        this.groundProgram.lightMVPLocation = this.gl.getUniformLocation(this.groundProgram, "lightMVP");
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
        this.model.normals = this.drawInfo.normals;
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
    Draw()
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
            if(this.heightOffset > 0.5)
                this.heightOffset = -1;
        }
        this.model.modelMatrix = translate(0, this.heightOffset, -3)
        let lightPos = vec3(2.0 * Math.sin(radians(this.rotation)), 2, 2.0 * Math.cos(radians(this.rotation)) -3);
        let lightMV = lookAt(lightPos, vec3(0, -2, -3), vec3(0, 1, 0))
        console.log(lightPos + " " + this.rotation);
        this.DrawShadowmap(lightMV);
        let MV = lookAt(vec3(0, 1, 1), vec3(0, 0, -3), vec3(0, 1, 0))
        this.DrawScene(MV, lightPos, lightMV);
        window.requestAnimationFrame(function() {this.Draw()}.bind(this));
    },
    DrawShadowmap : function(MV)
    {
        // Disable culling to not have gaps in the shadows
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.shadowFramebuffer)
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0, 0, this.shadowFramebuffer.width, this.shadowFramebuffer.height)
        this.lightMVP = {}
        let lightP = perspective(90.0, 1.0, 0.5, 5.0);
        this.lightMVP.ground = mult(lightP, MV);
        this.gl.useProgram(this.shadowProgram);
        this.gl.uniformMatrix4fv(this.shadowProgram.MVPLocation, false, flatten(this.lightMVP.ground));
        this.Bind(this.groundPlane, this.shadowProgram);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.groundPlane.vertices.length)

        this.lightMVP.teacup = mult(lightP, mult(MV, this.model.modelMatrix))
        this.gl.uniformMatrix4fv(this.shadowProgram.MVPLocation, false, flatten(this.lightMVP.teacup));
        this.Bind(this.model, this.shadowProgram);
        this.gl.drawElements(this.gl.TRIANGLES, this.model.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        this.gl.enable(this.gl.CULL_FACE);
    },
    DrawScene : function(MV, lightPos, lightMV)
    {
        // Draw the plane
        this.gl.useProgram(this.groundProgram);
        this.gl.uniformMatrix4fv(this.groundProgram.MVLocation, false, flatten(MV));
        this.gl.uniformMatrix4fv(this.groundProgram.PLocation, false, flatten(this.P))
        this.gl.uniformMatrix4fv(this.groundProgram.lightMVPLocation, false, flatten(this.lightMVP.ground));
        this.gl.uniform1i(this.groundProgram.textureUniform, 0);
        this.gl.uniform1i(this.groundProgram.shadowMapLocation, 1);
        this.Bind(this.groundPlane, this.groundProgram);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.groundPlane.vertices.length)
         
        this.gl.useProgram(this.teacupProgram);
        // Bind shading parameters
        this.gl.uniform3fv(this.teacupProgram.ambienceLocation, vec3(this.ambientScale, this.ambientScale, this.ambientScale));
        this.gl.uniform3fv(this.teacupProgram.diffuseLocation, vec3(this.diffuseScale, this.diffuseScale, this.diffuseScale));
        this.gl.uniform3fv(this.teacupProgram.specularLocation, vec3(this.specularScale, this.specularScale, this.specularScale));
        this.gl.uniformMatrix4fv(this.teacupProgram.lightMVPLocation, false, flatten(this.lightMVP.teacup))
        this.gl.uniform1i(this.teacupProgram.shadowMapLocation, 1);
        this.gl.uniform1f(this.teacupProgram.shininessLocation, this.shininess);
        this.gl.uniform4f(this.teacupProgram.lightPosition, lightPos[0], lightPos[1], lightPos[2], 1);

        // Draw objects
        let normM = normalMatrix(mult(MV, this.model.modelMatrix), true)
        this.gl.uniformMatrix3fv(this.teacupProgram.normMatrixLocation, false, flatten(normM));
        this.gl.uniformMatrix4fv(this.teacupProgram.PLocation, false, flatten(this.P))
        this.gl.uniformMatrix4fv(this.teacupProgram.VLocation, false, flatten(MV));
        this.gl.uniformMatrix4fv(this.teacupProgram.MLocation, false, flatten(this.model.modelMatrix));
        this.Bind(this.model, this.teacupProgram);
        this.gl.drawElements(this.gl.TRIANGLES, this.model.indices.length, this.gl.UNSIGNED_SHORT, 0);
         
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
