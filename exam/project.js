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

function Setup()
{
   canvas = document.getElementById("c");
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
function InitShaderParams()
{
    terrainProgram.P = gl.getUniformLocation(terrainProgram,  "P");
    terrainProgram.MV = gl.getUniformLocation(terrainProgram,  "MV");
    terrainProgram.vPos = gl.getAttribLocation(terrainProgram, "a_Position");
}

function LoadObjects()
{
    quad = CreatePlane(10);
    Commit(quad);
}

function Run()
{
    Setup();

    InitGLParameters()
    terrainProgram = initShaders(gl, "vertex-shader-terrain", "fragment-shader-terrain")
    gl.useProgram(terrainProgram);
    InitShaderParams();
    LoadObjects();

    P = perspective(90, 3, 1, -2);
    V = lookAt(vec3(0.5, 0.5, 1), vec3(0.5, 0.5, 0), vec3(0, 1, 0));
    gl.uniformMatrix4fv(terrainProgram.P, false,  flatten(P));
    gl.uniformMatrix4fv(terrainProgram.MV, false,  flatten(V));
   
    window.requestAnimationFrame(Draw);
}

function DrawScene()
{
    Bind(quad, terrainProgram);
    gl.drawElements(gl.TRIANGLES, quad.indices.length, gl.UNSIGNED_SHORT, 0);
}

function Draw(MV, P)
{
    this.gl.clearColor(1.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    DrawScene();
    window.requestAnimationFrame(Draw);
}

function CreatePlane(n)
{
    let vertices = []
    let indices = []
    let delta = 1 / n;
    for(x=0;x<n;++x)
    {
        let xPos = delta * x;
        for(y=0;y<n;++y)
        {
            let offset = vertices.length;
            yPos = delta * y;
            vertices.push(vec3(xPos, yPos, 0))
            vertices.push(vec3(xPos, yPos + delta, 0))
            vertices.push(vec3(xPos + delta, yPos, 0))
            vertices.push(vec3(xPos + delta, yPos + delta, 0))

            let newIndices = [
                1, 0, 2,
                2, 3, 1
            ]
            for(newIndex of newIndices)
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
    buffers = {
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
