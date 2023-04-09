//---- Constants --------------------------------------------------------------


/** ID for the game canvas. */
const CANVAS_ID = 'asteroids_canvas';

/**
 * Aspect ratio for the game canvas. This is the width of the canvas divided by
 * the height.
 */
const CANVAS_ASPECT = 16.0 / 10.0;


//---- Canvas management ------------------------------------------------------


/**
 * Clear the HTML document of any previous elements, and add the game canvas
 * to the HTML document.
 */
function addCanvas() {
    // Clear any previous HTML elements
    document.body.innerHTML = null;

    // Add a canvas
    const canvas = document.createElement('canvas');
    canvas.id = CANVAS_ID;
    document.body.appendChild(canvas);
}


/**
 * Resize and position the canvas so that it occupies the center of the window
 * and maintains its aspect ratio.
 */
function resizeCanvas() {
    let canvas_width, canvas_height;
    const window_aspect = window.innerWidth / window.innerHeight;
    if (window_aspect < CANVAS_ASPECT) {
        canvas_width  = window.innerWidth;
        canvas_height = canvas_width / CANVAS_ASPECT;
    } else {
        canvas_height = window.innerHeight;
        canvas_width  = canvas_height * CANVAS_ASPECT;
    }

    const canvas_x = (window.innerWidth  - canvas_width) / 2;
    const canvas_y = (window.innerHeight - canvas_height) / 2;

    const canvas = document.getElementById(CANVAS_ID);
    canvas.width  = canvas_width;
    canvas.height = canvas_height;
    canvas.style.position = 'absolute';
    canvas.style.left     = `${canvas_x}px`;
    canvas.style.top      = `${canvas_y}px`;
}


/** Add a listener to resize the canvas when the window resizes. */
function addResizeListener() {
    window.addEventListener('resize', () => { resizeCanvas(); testQuad(); })
}


//---- Linear stroke renderer -------------------------------------------------

const LOC_TILE_VERT           = 0;
const LOC_TILE_INSTANCE_COORD = 1;


const VERTEX_SHADER_GLSL =
`#version 300 es

// tile_vert is the location of the vertex in the tile geometry. Each tile
// has four vertices in a TRIANGLE_STRIP.
layout(location = ${LOC_TILE_VERT}) in vec2 tile_vert;

// tile_instance_coord is the coordinate of the tile instance within the grid,
// used to move the tile geometry to its desired location.
layout(location = ${LOC_TILE_INSTANCE_COORD}) in ivec2 tile_instance_coord;

// Uniforms
uniform ivec2 tile_size;
uniform ivec2 canvas_size;

void main() {
  vec2 pv = tile_vert + vec2(tile_instance_coord * tile_size);
  vec2 p  = 2.0 * pv / vec2(canvas_size) - 1.0;

  gl_Position = vec4(p.x, p.y, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_GLSL =
`#version 300 es
precision highp float;

out vec4 out_color;
void main() {
  out_color = vec4(0.1, 0.4, 0.1, 1.0);
}
`

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);
        const msg =
              'Error compiling shader.\n' +
              'Source:\n' +
              source +
              'Error message:\n' +
              err +
              '\n';
        console.error(msg);
        gl.deleteShader(shader);
    }

    return shader;
}


function testQuad() {
    const canvas = document.getElementById(CANVAS_ID);
    const gl = canvas.getContext('webgl2');

    const vertShader =
          createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_GLSL);
    const fragShader =
          createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_GLSL);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(`Error linking shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    }
    gl.useProgram(shaderProgram);

    const tileSize = 32;

    const vertexData =
          new Float32Array(
              [
                         0,        0,
                         0, tileSize,
                  tileSize,        0,
                  tileSize, tileSize
              ]
          );
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    const tileInstanceCoords =
          new Int32Array(
              [
                  0, 0,
                  1, 1,
                  2, 1,
                  10, 10
              ]
          );
    const tileInstanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tileInstanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tileInstanceCoords, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(LOC_TILE_VERT);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(LOC_TILE_VERT, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(LOC_TILE_INSTANCE_COORD);
    gl.bindBuffer(gl.ARRAY_BUFFER, tileInstanceBuffer);
    gl.vertexAttribIPointer(LOC_TILE_INSTANCE_COORD, 2, gl.INT, 0, 0);
    gl.vertexAttribDivisor(LOC_TILE_INSTANCE_COORD, 1);

    const uloc_tile_size = gl.getUniformLocation(shaderProgram, 'tile_size');
    const uloc_canvas_size = gl.getUniformLocation(shaderProgram, 'canvas_size');
    gl.uniform2i(uloc_canvas_size, canvas.width, canvas.height);
    gl.uniform2i(uloc_tile_size,   tileSize, tileSize);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.30, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    console.log(`nVerts        = ${vertexData.length / 2}`);
    console.log(`instanceCount = ${tileInstanceCoords.length / 2}`);

    const nVerts        = vertexData.length / 2;
    const instanceCount = tileInstanceCoords.length / 2;
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, nVerts, instanceCount);
}


//-----------------------------------------------------------------------------


addCanvas()
resizeCanvas()
addResizeListener()

testQuad()
