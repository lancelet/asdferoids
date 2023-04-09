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

// Copy-coordinates vertes shader
const VERTEX_GLSL =
`
attribute vec2 coord;
uniform vec2 sz_canvas;

void main(void) {
  float x = 2.0 * coord.x / sz_canvas.x - 1.0;
  float y = 2.0 * coord.y / sz_canvas.y - 1.0;
  gl_Position = vec4(x, y, 0.0, 1.0);
}
`

const FRAG_GLSL =
`
void main(void) {
  gl_FragColor = vec4(0.1, 0.4, 0.1, 0.1);
}
`

/*
function createShaders(gl) {
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, VERTEX_GLSL);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, FRAG_GLSL);
    gl.compileShader(fragShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
}
*/

function testQuad() {
    const canvas = document.getElementById(CANVAS_ID);
    const gl = canvas.getContext("webgl");

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, VERTEX_GLSL);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, FRAG_GLSL);
    gl.compileShader(fragShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    /*
    const vertices = [
        0.2, 0.2,
        0.5, 0.2,
        0.5, 0.5,
        0.2, 0.5,
    ]
    */
    const vertices = [
         0.0,  0.0,
        32.0,  0.0,
        32.0, 32.0,
         0.0, 32.0
    ];
    const indices = [0, 1, 2, 0, 2, 3];

    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    const locCoord = gl.getAttribLocation(shaderProgram, 'coord');
    const locSzCanvas = gl.getUniformLocation(shaderProgram, 'sz_canvas');
    gl.vertexAttribPointer(locCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locCoord);
    gl.uniform2f(locSzCanvas, canvas.width, canvas.height);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.30, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}



//-----------------------------------------------------------------------------



function main() {
  const canvas = document.getElementById(CANVAS_ID);
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  gl.clearColor(0.30, 0.05, 0.05, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

    testQuad(gl);
}


addCanvas()
resizeCanvas()
addResizeListener()

// main()
testQuad()
