import { CanvasResizer } from "./canvas-resizer";

/**
 * Main function.
 *
 * This should be called when the page is first loaded.
 */
function main() {
  const canvas: HTMLCanvasElement =
    document.getElementById('game-canvas') as HTMLCanvasElement;
  new CanvasResizer(window, canvas);
}


/** Application entry point. */
main();
