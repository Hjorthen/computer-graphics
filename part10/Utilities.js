function SliderValue(slider)
{
    console.log("Creating slider for " + slider)
    this.min = slider.min
    this.max = slider.max
    this.value = slider.value
    this.slider = slider
    
    this.slider.oninput = function()
    {
        this.value = this.slider.value;
        console.log("Changed value to " + this.value)
    }.bind(this)

    this.SetValue = function(val)
    {
        if(this.min > val || this.max < val)
            throw "Value out of bounds"

        this.slider.value = val
        this.value = val
    }
    return this;
}

function scaleMatrix(c, m)
{
    if(!m.matrix)
        throw "Not matrix"

    var result = []
    for(v of m)
    {
        var r = []
        for(e of v)
        {
            r.push(e * c)
        }
        result.push(r)
    }

    return result
}

function multPairwise(m1, m2)
{
    if(!(m1.matrix && m2.matrix))
        throw "Not matrix"
    var result = []
    for(i in m1)
    {
        var r = []
        for(j in m1[i])
        {
            var m1v = m1[j]
            var m2v = m2[j]
            r.push(m1v * m2v)
        }
        result.push(r)
    }
}
