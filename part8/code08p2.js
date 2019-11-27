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
        // Rotation settings
        this.rotateCheckbox = document.getElementById("rotate");
        this.rotation = 0;
        this.rotationSlider = document.getElementById("rotation");
        this.rotationSlider.oninput = function(e) {
                this.rotation = this.rotationSlider.value;
        }.bind(this);

        this.gl = setupWebGL(this.canvas);
        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
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
            vPos : 'vertices',
            vUV : 'uvs'
        };

        for(let value of Object.values(buffers))
        {
            if(typeof obj[value] != 'undefined')
            {
                let bufferName = value + 'Buffer';
                if(typeof obj[bufferName] == 'undefined')
                    obj[bufferName] = this.gl.createBuffer();
                 
                console.log("Binding " + bufferName + " to " + value)
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj[bufferName]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(obj[value]), this.gl.STATIC_DRAW)
            }
        }
    },
    Bind(obj)
    {
        buffers = {
            vPos : {
                name :  'vertices',
                size : 4
            },
            vUV : {
                name : 'uvs',
                size : 2
            }
        };

        for(let [key, value] of Object.entries(buffers))
        {
            let bufferName = value.name + 'Buffer';
            if(typeof this[key] != 'undefined' && typeof obj[bufferName] != 'undefined')
            {
               this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj[bufferName])
               this.gl.vertexAttribPointer(this[key], value.size, this.gl.FLOAT, false, 0, 0);
            }
        }
    },
    CreateTextures()
    {
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
             window.requestAnimationFrame(function() {this.Draw()}.bind(this));
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

        this.textureUniform = gl.getUniformLocation(this.program, "colorTexture")
    },
    Run()
    {
        this.Setup();
        var gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        //gl.enable(gl.CULL_FACE);
        gl.useProgram(this.program);
        
        this.SetPerspective(false);
        this.MVLocation = gl.getUniformLocation(this.program, "MV");
        this.PLocation  = gl.getUniformLocation(this.program, "P");

        this.vPos = this.gl.getAttribLocation(this.program, "a_Position");
        this.gl.enableVertexAttribArray(this.vPos);
        this.vUV =  this.gl.getAttribLocation(this.program, "a_UV");
        this.gl.enableVertexAttribArray(this.vUV);

        this.groundPlane = this.GetQuad();
        var groundTransform = mult(translate(0, -1, -5), mult(scalem(2, 1, 4), rotateX(-90)))
        // Transform the quad vertices to the right orientation
        for(i=0;i<this.groundPlane.vertices.length;++i)
        {
           this.groundPlane.vertices[i] = mult(groundTransform, this.groundPlane.vertices[i]); 
        }
        this.Commit(this.groundPlane);

        // Upright quad
        this.parellelPlane = this.GetQuad();
        let parallelTransform = mult(translate(0.5, -0.5, -1.50), mult(scalem(0.25, 1, 0.25), rotateX(-90)))
        for(i=0;i<this.parellelPlane.vertices.length;++i)
        {
           this.parellelPlane.vertices[i] = mult(parallelTransform, this.parellelPlane.vertices[i]); 
        }
        this.Commit(this.parellelPlane);

         
        this.upPlane = this.GetQuad();
        let upTransform = mult(translate(-1, -0.5, -2.75), mult(scalem(1, 0.5, 0.25), rotateY(90)));
        for(i=0;i<this.upPlane.vertices.length;++i)
        {
           this.upPlane.vertices[i] = mult(upTransform, this.upPlane.vertices[i]); 
        }
        this.Commit(this.upPlane);
        
        this.CreateTextures();
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
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        if(this.rotateCheckbox.checked)
        {
            this.rotation = (this.rotation + 0.5)%360;    
            this.rotationSlider.value = this.rotation;
        }
        MV = lookAt(vec3(0, 0, 1), vec3(0, 0, -3), vec3(0, 1, 0))
        this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(MV));
        this.gl.uniformMatrix4fv(this.PLocation, false, flatten(this.P))


        this.gl.uniform1i(this.textureUniform, 0);
        this.Bind(this.groundPlane);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.groundPlane.vertices.length)

        this.gl.uniform1i(this.textureUniform, 1);
        this.Bind(this.upPlane);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.upPlane.vertices.length)
        this.Bind(this.parellelPlane);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parellelPlane.vertices.length)

        let lightPos = vec3(2.0 * Math.sin(radians(this.rotation)), 2, 2.0 * Math.cos(radians(this.rotation)) -2); 
        let shadowProjectMatrix = mat4();
        shadowProjectMatrix[3][3] = 0.0;
        shadowProjectMatrix[3][1]= -1.0/(lightPos[1] - -1.0);
        let lightTranslation = translate(lightPos[0], lightPos[1], lightPos[2]);
        let shadowMatrix = mult(MV, lightTranslation)
        shadowMatrix = mult(shadowMatrix, shadowProjectMatrix)
        shadowMatrix = mult(shadowMatrix, inverse(lightTranslation));
         
        /*
        PrintTransform(this.parellelPlane.vertices, MV)
        PrintTransform(this.upPlane.vertices, MV);
        PrintTransform(this.groundPlane.vertices, MV);
        */

        this.gl.uniformMatrix4fv(this.MVLocation, false, flatten(shadowMatrix));
        this.Bind(this.parellelPlane);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parellelPlane.vertices.length)
        this.Bind(this.upPlane);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.upPlane.vertices.length);

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


onload= Renderer.Run();
