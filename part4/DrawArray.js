
function DrawArray(glContext, colorAttribPointer, positionAttribPointer, size)
{
    this.gl = glContext;
    this.bufferSize = size;
    this.vertices = []
    this.colors = []
    this.ColorAttribPointer = colorAttribPointer
    this.PositionAttribPointer = positionAttribPointer
    
    this.Allocate = function()
    {
        this.buffer = glContext.createBuffer()
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this.buffer)
        glContext.bufferData(glContext.ARRAY_BUFFER, this.bufferSize, glContext.STATIC_DRAW)


        this.colorBuffer = colorBuffer = glContext.createBuffer()
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this.colorBuffer)
        glContext.bufferData(glContext.ARRAY_BUFFER, this.bufferSize, glContext.STATIC_DRAW)
    }

    this.AddVertex = function(pos, color){
        this.vertices.push(pos)
        this.colors.push(color)
    }

    this.Commit = function()
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.vertices))

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.colors))
    }
   
    this.Bind = function()
    {
        // Bind color buffer and then vertices
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
        this.gl.vertexAttribPointer(this.ColorAttribPointer, 4, this.gl.FLOAT, false, 0, 0)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
        this.gl.vertexAttribPointer(this.PositionAttribPointer, 3, this.gl.FLOAT, false, 0, 0);
    }
    
    this.Clear = function()
    {
        this.gl.deleteBuffer(this.buffer)
        this.gl.deleteBuffer(this.colorBuffer)
        this.vertices = []
        this.colors = []
        this.Allocate()
    }
    this.Allocate();
}


