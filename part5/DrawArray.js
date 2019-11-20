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

    this.Allocate();
}  

DrawArray.prototype.Allocate = function()
{
    this.buffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.bufferSize * 4, this.gl.STATIC_DRAW)


    if(typeof this.ColorAttribPointer != 'undefined')
    {
        this.colorBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, (this.bufferSize / 3) * 4 * 4, this.gl.STATIC_DRAW)
    }

    this.normalBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.bufferSize * 4, this.gl.STATIC_DRAW)
}

DrawArray.prototype.AddVertex = function(pos, color, normal){
    this.vertices.push(pos)
    this.colors.push(color)
    this.normals.push(normal)
}

DrawArray.prototype.Commit = function()
{
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.vertices))

    if(typeof this.ColorAttribPointer != 'undefined')
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.colors))
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer)
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, flatten(this.normals))
}
   
DrawArray.prototype.Bind = function()
{
    // Bind color buffer and then vertices

    if(typeof this.ColorAttribPointer != 'undefined')
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
        this.gl.vertexAttribPointer(this.ColorAttribPointer, 4, this.gl.FLOAT, false, 0, 0)
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
    this.gl.vertexAttribPointer(this.PositionAttribPointer, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer)
    if(this.NormalAttribPointer !=  -1)
        this.gl.vertexAttribPointer(this.NormalAttribPointer, 3, this.gl.FLOAT, false, 0, 0)
}
    
DrawArray.prototype.Clear = function()
{
    this.gl.deleteBuffer(this.buffer)
    if(typeof this.colorBuffer != 'undefined')
        this.gl.deleteBuffer(this.colorBuffer)
    this.gl.deleteBuffer(this.normalBuffer)
    this.vertices = []
    this.colors = []
    this.normals = []
    this.Allocate()
}
