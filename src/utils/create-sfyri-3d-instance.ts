import { Camera, Scene, WebGLRenderer, WebGLRendererParameters } from "three";
import Sfyri3DInstance from "../types/classes/sfyri3d-instance.class";

/**
 * @throws This method can throw error.
 * @param canvasElement string of query selector or canvas element ref used to get the canvas where the scene will render.
 * @param camerasFactoryMethod Method used to create the cameras of the instance, in the method the canvas element will be 
 * usable to calculate the cameras params.
 * @param webGLRendererParameters Additional params for the renderer, don't pass the canvas here as it will be overwritten by this method.
 * @param initialState check first comment over Sfyri3DInstance to understand what to pass.
 * @returns Sfyri3DInstance object WITH NON STARTED RENDER LOOP.
 * @returns 
 */
export function createSfyri3DInstance<T>(
    canvas: string | HTMLCanvasElement,
    camerasFactoryMethod: (container: HTMLElement) => Camera[],
    webGLRendererParameters: WebGLRendererParameters | null = null,
    initialState: T,
): Sfyri3DInstance<T> {

    //SECTION - GET CANVAS
    let sceneCanvas: HTMLCanvasElement | null = null;
    //NOTE - null / undefined check for javascript
    if (!canvas)
        throw new Error(`SFYRI3D - CreateSfyriInstance\nNo query selector string for the canvas element or existing canvas element ref was passed.`);
    if (canvas instanceof HTMLCanvasElement)
        sceneCanvas = canvas;
    else {
        sceneCanvas = document.querySelector(canvas);
        if (!sceneCanvas)
            throw new Error(`SFYRI3D - CreateSfyriInstance\nCanvas with selector ${canvas} not found.`);
    }
    //!SECTION - GET CANVA

    //Create the cameras with the method passed
    /* NOTE:    this allow us to make the user work as if they 
                already know the sizes of the scene canvas
    */
    const cameras = camerasFactoryMethod(sceneCanvas!);
    const renderer = new WebGLRenderer({
        ...webGLRendererParameters,
        canvas: sceneCanvas
    });
    renderer.setSize(sceneCanvas.clientWidth, sceneCanvas.clientHeight, false);
    const scene = new Scene();

    return new Sfyri3DInstance(scene, renderer, cameras, initialState);
}