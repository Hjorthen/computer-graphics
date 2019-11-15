function DrawElements(glContext, colorAttribPointer, positionAttribPointer, normalAttribPointer, size, elementBufferSize)
{
    this.indices = [];
    this.elementBufferSize = elementBufferSize;
     
    DrawArray.call(this, glContext, colorAttribPointer, positionAttribPointer, normalAttribPointer, size);
    DrawElements.prototype = Object.create(DrawArray.prototype);
    Object.defineProperty(DrawElements.prototype, 'constructor', {
        value : DrawElements,
        enumerable : false,
        writeable : true
    });

}  

DrawElements.prototype.Allocate = function()
{
    DrawArray.prototype.Allocate.call(this);
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, 4 * this.elementBufferSize, this.gl.STATIC_DRAW);

}

DrawElements.prototype.Commit = function()
{
    DrawArray.prototype.Commit.call(this);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(this.indices));
}
   
DrawElements.prototype.Bind = function()
{
    DrawArray.prototype.Bind.call(this);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
}
    
DrawElements.prototype.Clear = function()
{
    this.gl.deleteBuffer(this.indexBuffer);
    this.indices = []
    DrawArray.prototype.Clear.call(this)
}
