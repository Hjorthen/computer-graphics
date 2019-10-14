
function quad(a, b, c, d)
{
   var indices = [a, b, c, a, c, d]
   var indiceRes = []

   for(var i = 0; i < indices.length; ++i)
    {
        indiceRes.push(indices[i]);
    }

    return indiceRes;
}

function UnitSphere(n, buffer)
{
    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);

    return new Tetrahedron(va, vb, vc, vd, n, buffer)
}

function Tetrahedron(a, b, c, d, n, buffer)
{
    this.DivideTriangle = function(a, b, c, count)
    {
        if(count > 0 )
        {
            var ab = normalize(mix(a, b, 0.5), true)
            var ac = normalize(mix(a, c, 0.5), true)
            var bc = normalize(mix(b, c, 0.5), true)

            this.DivideTriangle(a, ab, ac, count - 1)
            this.DivideTriangle(ab, b, bc, count - 1)
            this.DivideTriangle(bc, c, ac, count - 1);
            this.DivideTriangle(ab, bc, ac, count - 1)
        }
        else
        {
            this.Triangle(a, b, c)   
        }
    },
    
    this.Triangle = function(a, b, c)
    {
       var color = vec4(1, 0, 0, 1)
       this.buffer.AddVertex(a, color, vec4(a[0], a[1], a[2], 0.0))
       this.buffer.AddVertex(b, color, vec4(b[0], b[1], b[2], 0.0))
       this.buffer.AddVertex(c, color, vec4(c[0], c[1], c[2], 0.0))
    }

    this.buffer = buffer;
    this.DivideTriangle(a, b, c, n);
    this.DivideTriangle(d, c, b, n);
    this.DivideTriangle(a, d, b, n);
    this.DivideTriangle(a, c, d, n);

    return buffer
}
