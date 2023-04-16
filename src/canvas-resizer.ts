
/**
 * Handle game canvas resizing.
 *
 * This class resizes the game canvas so that it has a consistent aspect ratio,
 * is centred in the window, and is as large as possible within the window
 * area.
 */
export class CanvasResizer {
  private static readonly CANVAS_ASPECT = (16.0 / 10.0);

  private readonly window: Window;
  private readonly canvas: HTMLCanvasElement;

  constructor(window: Window, canvas: HTMLCanvasElement) {
    this.window = window;
    this.canvas = canvas;

    window.addEventListener('resize', this.resize.bind(this));
    this.resize()
  }

  private resize() {
    // Get the window aspect ratio.
    const window_aspect = this.window.innerWidth / this.window.innerHeight;

    // Establish the canvas width and height.
    let canvas_width: number;
    let canvas_height: number;
    if (window_aspect < CanvasResizer.CANVAS_ASPECT) {
      canvas_width  = window.innerWidth;
      canvas_height = canvas_width / CanvasResizer.CANVAS_ASPECT;
    } else {
      canvas_height = window.innerHeight;
      canvas_width  = canvas_height * CanvasResizer.CANVAS_ASPECT;
    }

    // Establish the canvas top left coordinate.
    const canvas_x = (window.innerWidth  - canvas_width) / 2;
    const canvas_y = (window.innerHeight - canvas_height) / 2;

    // Set the canvas position and size.
    this.canvas.width          = canvas_width;
    this.canvas.height         = canvas_height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left     = `${canvas_x}px`
    this.canvas.style.top      = `${canvas_y}px`
  }
}
