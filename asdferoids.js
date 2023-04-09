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


const VERT_GLSL =
`#version 300 es

// tile_vert is the location of the vertex in the tile geometry. Each tile
// has four vertices in a TRIANGLE_STRIP.
layout(location = ${LOC_TILE_VERT}) in uvec2 tile_vert;

// tile_instance_coord is the coordinate of the tile instance within the grid,
// used to move the tile geometry to its desired location.
layout(location = ${LOC_TILE_INSTANCE_COORD}) in uvec2 tile_instance_coord;

// Uniforms
uniform uvec2 tile_size;
uniform uvec2 canvas_size;

void main() {
  vec2 pv = vec2(tile_vert + tile_instance_coord * tile_size);
  vec2 p  = 2.0 * pv / vec2(canvas_size) - 1.0;

  gl_Position = vec4(p.x, p.y, 0.0, 1.0);
}
`

const FRAG_GLSL =
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

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERT_GLSL);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAG_GLSL);
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
          new Uint8Array(
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
          new Uint16Array(
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
    gl.vertexAttribIPointer(LOC_TILE_VERT, 2, gl.UNSIGNED_BYTE, 0, 0);

    gl.enableVertexAttribArray(LOC_TILE_INSTANCE_COORD);
    gl.bindBuffer(gl.ARRAY_BUFFER, tileInstanceBuffer);
    gl.vertexAttribIPointer(LOC_TILE_INSTANCE_COORD, 2, gl.UNSIGNED_SHORT, 0, 0);
    gl.vertexAttribDivisor(LOC_TILE_INSTANCE_COORD, 1);

    const uloc_tile_size = gl.getUniformLocation(shaderProgram, 'tile_size');
    const uloc_canvas_size = gl.getUniformLocation(shaderProgram, 'canvas_size');
    gl.uniform2ui(uloc_canvas_size, canvas.width, canvas.height);
    gl.uniform2ui(uloc_tile_size,   tileSize, tileSize);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.30, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const nVerts        = vertexData.length / 2;
    const instanceCount = tileInstanceCoords.length / 2;
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, nVerts, instanceCount);
}


//---- Renderable object encoding ---------------------------------------------

class BBox {
    constructor(xmin, ymin, xmax, ymax) {
        this.xmin = xmin <= xmax ? xmin : xmax;
        this.xmax = xmax >= xmin ? xmax : xmin;
        this.ymin = ymin <= ymax ? ymin : ymax;
        this.ymax = ymax >= ymin ? ymax : ymin;
    }

    addBorder(width) {
        return new BBox(
            this.xmin - width,
            this.ymin - width,
            this.xmax + width,
            this.ymax + width
        );
    }

    tileHits(tileSize) {
        const minTileX = Math.floor(this.xmin / tileSize);
        const maxTileX = Math.ceil (this.xmax / tileSize);
        const minTileY = Math.floor(this.ymin / tileSize);
        const maxTileY = Math.ceil (this.ymax / tileSize);

        return {
            minTileX: minTileX,
            maxTileX: maxTileX,
            minTileY: minTileY,
            maxTileY: maxTileY
        }
    }

    intersects(other) {
        return true;
    }
}

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    bbox() {
        return new BBox(
            this.x - this.r,
            this.y - this.r,
            this.x + this.r,
            this.y + this.r
        );
    }

    encode(epb) {
        epb.push(0);       // type marker for a circle
        epb.push(this.x);
        epb.push(this.y);
        epb.push(this.r);
    }
}

class Line {
    constructor(x0, y0, x1, y1, width) {
        this.x0    = x0;
        this.y0    = y0;
        this.x1    = x1;
        this.y1    = y1;
        this.width = width;
    }

    bbox() {
        const hw = this.width / 2.0;
        let xmin, ymin, xmax, ymax;
        if (this.x0 <= this.x1) {
            xmin = this.x0;
            xmax = this.x1;
        } else {
            xmin = this.x1;
            xmax = this.x0;
        }
        if (this.y0 <= this.y1) {
            ymin = this.y0;
            ymax = this.y1;
        } else {
            ymin = this.y1;
            ymax = this.y0;
        }
        return new BBox(xmin - hw, ymin - hw, xmax + hw, ymax + hw);
    }

    encode(epb) {
        epb.push(1);       // type marker for a line
        epb.push(this.x0);
        epb.push(this.y0);
        epb.push(this.x1);
        epb.push(this.y1);
        epb.push(this.width);
    }
}


class EncodedPrimBuf {
    constructor(size) {
        this.encoded = new Float32Array(size)
        this.ofs     = 0
    }

    push(value) {
        this.encoded[this.ofs++] = value;
    }

    buffer() {
        return this.encoded;
    }

    length() {
        return this.ofs;
    }
}


class Geoms {
    constructor(primBuf, canvasWidth, canvasHeight, tileSize, addedBorder) {
        this.canvasWidth  = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.tileSize     = tileSize;
        this.addedBorder  = addedBorder;
        this.canvasBBox   = new BBox(0, 0, canvasWidth, canvasHeight);

        this.primBuf = primBuf;

        this.nTilesX = Math.ceil(canvasWidth  / tileSize);
        this.nTilesY = Math.ceil(canvasHeight / tileSize);
        this.nTiles = this.nTilesX * this.nTilesY;
        this.tilePrims = new Array(this.nTiles).fill(null);
    }

    pushPrim(prim) {
        const bbox = prim.bbox().addBorder(this.addedBorder);
        if (bbox.intersects(this.canvasBBox)) {
            const ofs = this.primBuf.length();
            prim.encode(this.primBuf);

            const hits = bbox.tileHits(this.tileSize);
            let tile_y = hits.minTileY;
            while (tile_y <= hits.maxTileY) {
                let tile_x = hits.minTileX;
                while (tile_x <= hits.maxTileX) {

                    const tile_idx = tile_y * this.nTilesX + tile_x;

                    let tile_arr = this.tilePrims[tile_idx];
                    if (this.tilePrims[tile_idx] == null) {
                        tile_arr = []
                        this.tilePrims[tile_idx] = tile_arr;
                    }

                    tile_arr.push(ofs);

                    tile_x += 1;
                }
                tile_y += 1;
            }
        }
    }

    drawCircle(x, y, r) {
        this.pushPrim(new Circle(x, y, r));
    }

    drawLine(x0, y0, x1, y1, width) {
        this.pushPrim(new Line(x0, y0, x1, y1, width));
    }
}


//-----------------------------------------------------------------------------


function testRender() {

    const canvas = document.getElementById(CANVAS_ID);

    const primBuf = new EncodedPrimBuf(512);
    const geoms = new Geoms(primBuf, canvas.width, canvas.height, 32, 0);

    geoms.drawCircle(10, 10, 5);
    geoms.drawLine(0, 0, 100, 200, 2);

    console.log(primBuf);
    console.log(geoms.tilePrims);

}

addCanvas()
resizeCanvas()
addResizeListener()

testRender()

testQuad()
