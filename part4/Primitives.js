
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
