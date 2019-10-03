
function GLBuffer(size, type, glContext)
{
    this.AllocateGPUBuffer = () => {
        this.glContext.bindBuffer(this.glContext.ELEMENT_ARRAY_BUFFER, this.buffer);
        this.glContext.bufferData(this.glContext.ELEMENT_ARRAY_BUFFER, size, this.glContext.STATIC_DRAW);
    }

    this.Bind = function() { this.glContext.bindBuffer(this.glContext.ELEMENT_ARRAY_BUFFER, this.buffer); }

    this.Add = function(element)
    {
        var insertIndex = this.data.length;   
        this.data.push(element);
    
        this.Bind();
        this.glContext.bufferSubData(this.glContext.ELEMENT_ARRAY_BUFFER, insertIndex, Uint8Array.from([element]));

    }   
    
    this.Size = function()
    {
        return this.data.length;
    }

    this.Clear = function()
    {
        this.AllocateGPUBuffer();
        this.data = [];
    }

    this.Strip = function(count)
    {
        var zero = new Array(count).fill(0);
        var startIndex = this.data.length - count;

        this.Bind();
        this.glContext.bufferSubData(this.glContext.ELEMENT_ARRAY_BUFFER, startIndex, Uint8Array.from(zero));
        this.data.length = startIndex;
    }

    this.glContext = glContext;
    this.buffer = glContext.createBuffer();
    if(typeof glContext === 'undefined')
        glContext = glContext.ARRAY_BUFFER;

    this.bufferSize = size;
    this.data = [];

    this.AllocateGPUBuffer();
}

