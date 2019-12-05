"use strict";

/** @type {WebGLRenderingContext} */
var gl;

function PrintTransform(v, m)
{
    console.log("Before transform:\n", v)
    let vp = v.slice();
    for(i=0;i<v.length;++i)
    {
        if(v[i].length < 4)
            v[i].push(1);
        vp[i] = mult(m, v[i]);
    }
    console.log("After transform:\n", vp);
}

function CreateFrameBufferObject(gl, width, height)
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
}

function Setup()
{
   window.canvas = document.getElementById("c");
   /** @type {WebGLRenderingContext} */
   gl = setupWebGL(canvas)
}

function InitGLParameters()
{
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
}
function InitShaderParams(program)
{
    program.P = gl.getUniformLocation(program,  "P");
    program.MV = gl.getUniformLocation(program,  "MV");
    program.vPos = gl.getAttribLocation(program, "a_Position");
    program.scale = gl.getUniformLocation(program, "scale");
    program.H = gl.getUniformLocation(program, "H");

}

function SetupSliders()
{
    window.sliders = {}
    for(var s of document.getElementsByTagName("input"))
    {
        if(s.getAttribute("type") == "range")
        {
            sliders[s.id] = s.value;
        }
        s.addEventListener('input', function(e)
            {
                sliders[this.id] = this.value;
                let callback = window[this.id + "Changed"];
                if(typeof callback != 'undefined')
                    callback(this.value);
            }
        )
    }
}



function LoadObjects()
{
    window.quad = CreatePlane(100);
    Commit(quad);
}

function Run()
{
    Setup();
    SetupSliders();

    InitGLParameters()
    window.terrainProgram = initShaders(gl, "vertex-shader-terrain", "fragment-shader-terrain")
    window.shadowProgram = initShaders(gl, "vertex-shader-terrain", "fragment-shader-shadowmap");
    gl.useProgram(terrainProgram);
    InitShaderParams(terrainProgram);
    InitShaderParams(shadowProgram);
    LoadObjects();

    window.cameraP = perspective(30, 3, 0.1, -2);
    let angle = 45.0;
    let cameraPos = vec3(0, 0, sliders.height); 
    // up vector takes into account that Z is height
    window.cameraV = lookAt(cameraPos, vec3(2, 2, 0), vec3(0, 0, 1));
    window.frameBuffer = CreateFrameBufferObject(gl, 256, 256);
     
    window.requestAnimationFrame(Draw);
}
function heightChanged(val)
{
    let cameraPos = vec3(0, 0, val); 
    // up vector takes into account that Z is height
    var cameraV = lookAt(cameraPos, vec3(2, 2, 0), vec3(0, 0, 1));
    console.log("Height changed.");
}

function DrawScene(MV, P)
{
    gl.useProgram(terrainProgram);
    gl.clearColor(135/255.0, 206/255.0, 235/255.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1f(terrainProgram.scale, sliders.noise);
    gl.uniform1f(terrainProgram.H, sliders.smoothness);
    gl.uniformMatrix4fv(terrainProgram.P, false, flatten(P));
    gl.uniformMatrix4fv(terrainProgram.MV, false,  flatten(MV));
    Bind(quad, terrainProgram);
    gl.drawElements(gl.TRIANGLES, quad.indices.length, gl.UNSIGNED_SHORT, 0);
}

function DrawShadowmap(MV, P)
{
    gl.useProgram(shadowProgram);
    // Set the MVP
    gl.uniform1f(shadowProgram.scale, sliders.noise);
    gl.uniform1f(shadowProgram.H, sliders.smoothness);
    gl.uniformMatrix4fv(shadowProgram.P, false, flatten(P));
    gl.uniformMatrix4fv(shadowProgram.MV, false,  flatten(MV));

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.viewport(0, 0, frameBuffer.width, frameBuffer.height)
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    Bind(quad, shadowProgram);
    gl.drawElements(gl.TRIANGLES, quad.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function Draw()
{
    let scaleM = scalem(2, 2, 1);
    DrawShadowmap(mult(cameraV, scaleM), cameraP);
    DrawScene(mult(cameraV, scaleM), cameraP);
    window.requestAnimationFrame(Draw);
}

function CreatePlane(n)
{
    let vertices = []
    let indices = []
    let delta = 1 / n;
    for(let x=0;x<n;++x)
    {
        let xPos = delta * x;
        for(let y=0;y<n;++y)
        {
            let offset = vertices.length;
            let yPos = delta * y;
            vertices.push(vec3(xPos, yPos, 0))
            vertices.push(vec3(xPos, yPos + delta, 0))
            vertices.push(vec3(xPos + delta, yPos, 0))
            vertices.push(vec3(xPos + delta, yPos + delta, 0))

            let newIndices = [
                1, 0, 2,
                2, 3, 1
            ]
            for(let newIndex of newIndices)
            {
                indices.push(newIndex + offset);
            }
        }
    }
    return { 
        vertices : vertices,
        indices : indices
    }
}
function Commit(obj)
{
    // Key-value pairs of the objects to upload
    let buffers = {
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
                obj[bufferName] = gl.createBuffer();
            let uploadSize = 0; 
            if(value.name === "indices")
            {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj[bufferName]);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj[value.name]), gl.STATIC_DRAW)
                uploadSize = obj[value.name].length
            }
            else
            {
                gl.bindBuffer(gl.ARRAY_BUFFER, obj[bufferName]);
                var data = flatten(obj[value.name]);
                gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
                uploadSize = data.length
            }
            console.log("Uploaded " + uploadSize + " for " + bufferName);
        }
    }
}
function Bind(obj, attribs)
{
    let buffers = {
        vPos : {
            name :  'vertices',
            size : 3
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
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj[bufferName])
            }
            else
            {
               // default size
               let size = value.size;
               if(typeof obj[value.name + "Size"] != 'undefined')
                    size = obj[value.name + "Size"];
               console.log("Binding " + bufferName + " to size " + size);
               gl.bindBuffer(gl.ARRAY_BUFFER, obj[bufferName])
               gl.vertexAttribPointer(attribs[key], size, gl.FLOAT, false, 0, 0);
               gl.enableVertexAttribArray(attribs[key])
            }
        }
    }
}

/* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
  return WebGLUtils.setupWebGL(canvas, { alpha: false });
}

onload= Run();
