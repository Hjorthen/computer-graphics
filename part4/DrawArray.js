function DrawArray(glContext, colorAttribPointer, positionAttribPointer, normalAttribPointer, size)
{
    this.gl = glContext;
    this.bufferSize = size;

    this.normals = []
    this.vertices = []
    this.colors = []

    this.ColorAttribPointer = colorAttribPointer
    this.PositionAttribPointer = positionAttribPointer
    this.NormalAttribPointer = normalAttribPointer
    
    this.Allocate = function()
    {
        this.buffer = glContext.createBuffer()
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this.buffer)
        glContext.bufferData(glContext.ARRAY_BUFFER, this.bufferSize, glContext.STATIC_DRAW)


        if(typeof this.ColorAttribPointer !== 'undefined')
        {
            this.colorBuffer = glContext.createBuffer()
            glContext.bindBuffer(glContext.ARRAY_BUFFER, this.colorBuffer)
            glContext.bufferData(glContext.ARRAY_BUFFER, this.bufferSize, glContext.STATIC_DRAW)
        }

        if(typeof this.NormalAttribPointer !== 'undefined')
        {
            this.normalBuffer = glContext.createBuffer()
            glContext.bindBuffer(glContext.ARRAY_BUFFER, this.normalBuffer, glContext.STATIC_DRAW)
            glContext.bufferData(glContext.ARRAY_BUFFER, this.bufferSize, glContext.STATIC_DRAW)
        }
    }

    this.AddVertex = function(pos, color, normal){
        this.vertices.push(pos)
        this.colors.push(color)
        this.normals.push(normal)
    }

    this.Commit = function()
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
        var coords = flatten(this.vertices);
        console.log("Uploading " + coords.length + " coordinates for " + coords.length / 4 + " vertices");
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, coords)

        if(typeof this.ColorAttribPointer !== 'undefined')
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.colors))
        }

        if(typeof this.NormalAttribPointer !== 'undefined')
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer)
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.normals))
        }
    }
   
    this.Bind = function()
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
        this.gl.vertexAttribPointer(this.PositionAttribPointer, 4, this.gl.FLOAT, false, 0, 0);

        if(typeof this.ColorAttribPointer !== 'undefined')
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
            this.gl.vertexAttribPointer(this.ColorAttribPointer, 4, this.gl.FLOAT, false, 0, 0)
        }
        if(!typeof this.NormalAttribPointer !== 'undefined')
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer)
            this.gl.vertexAttribPointer(this.NormalAttribPointer, 4, this.gl.FLOAT, false, 0, 0)
        }
    }
    
    this.Clear = function()
    {
        this.gl.deleteBuffer(this.buffer)
        if(!typeof this.colorBuffer !== 'undefined')
            this.gl.deleteBuffer(this.colorBuffer)
        if(!typeof this.normalBuffer !== 'undefined')
            this.gl.deleteBuffer(this.normalBuffer)
        this.vertices = []
        this.colors = []
        this.normals = []
        this.Allocate()
    }
    this.Allocate();
flatten(this.vertices)}


