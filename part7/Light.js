// Position.w = 0 for directional light
function Light(ambient, diffuse, specular, position)
{
    return {
        ambient : ambient,
        diffuse : diffuse,
        specular : specular,
        position : position,

        ColorMatrix : function()
        {
            return transpose(mat4(ambient, diffuse, specular, vec4(0, 0, 0, 0)));
        }

    }
}
