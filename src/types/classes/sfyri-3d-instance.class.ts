import { Scene, Camera, WebGLRenderer, Timer, PerspectiveCamera, OrthographicCamera } from "three";

/**
 * Entry point of the Sfyri 3D Framework handling system
 */
export default class Sfyri3DInstance {
    //SECTION - THREEJS PROPS
    private _scene: Scene;
    public get scene(): Scene {
        return this._scene;
    }

    private _renderer: WebGLRenderer;
    public get renderer(): WebGLRenderer {
        return this._renderer;
    }

    private _cameras: Camera[];
    public get cameras(): Camera[] {
        return this._cameras;
    }
    //!SECTION - THREEJS PROPS

    //SECTION - SFYRI3D PROPS
    /** used to calcuate the time between frame in render cycle */
    private _timeBetweenFrames: number = 1000 / 60;

    private _targetFps: number = 60;
    public get targetFps(): number {
        return this._targetFps;
    }
    /**
     * @param targetFps the fps you want to use as a ceiling for the animation loop to target.
     * If you don't set it the default is 60fps
     */
    public setTargetFps(targetFps: number) {
        this._targetFps = targetFps;
        this._timeBetweenFrames = 1000 / targetFps;
    }

    private _timer: Timer;

    /** holds the resize function ref passed to the addEventListener so we can remove it later */
    private _resizeEventFunctionRef: (() => void) | null = null;
    //!SECTION - SFYRI3D PROPS

    //CONSTRUCTOR
    constructor(scene: Scene, renderer: WebGLRenderer, cameras: Camera[]) {
        //passed props assign
        this._scene = scene;
        this._renderer = renderer;
        if (cameras.length === 0)
            throw new Error(`SFYRI - Sfyri3DInstance Constructor\nNo camera where passed to the instance you wanted to create.`);

        this._cameras = cameras;

        //auto created props
        this._timer = new Timer();
    }

    //SECTION - PUBLIC METHODS
    public startRender(
        enableResize: boolean = true,
        targetFps: number | null = null) {
        //ENABLE RESIZE HANDLING
        if (enableResize) {
            this._resizeEventFunctionRef = () => {
                for (let i = 0; i < this.cameras.length; i++) {
                    const camera = this.cameras[i];
                    //UPDATE CAMERA
                    this.handleResizeOnCamera(camera);

                    //UPDATE RENDER
                    this.renderer.setSize(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight);
                }
            }
            window.addEventListener('resize', this._resizeEventFunctionRef);
        }

        //FPS TARGET HANDLING
        if (targetFps)
            this.setTargetFps(targetFps);

        //TODO start animation loop
        //TODO decide loop pipeline
        //TODO handle three js assets presence
    }

    public stopRender() {
        //TODO stop animation
    }

    public killRender() {
        //TODO kill animation loop and dispose of everything
    }
    //!SECTION - PUBLIC METHODS

    //SECTION - PRIVATE METHODS
    /**
     * 
     * @param camera camera where we need to adjust the params according to new renderer dom element size
     */
    private handleResizeOnCamera(camera: Camera) {
        //PERSPECTIVE CAMERA
        if (camera instanceof PerspectiveCamera) {
            camera.aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
            camera.updateProjectionMatrix();
        }

        //ORTOGRAPHIC CAMERA
        else if (camera instanceof OrthographicCamera) {
            const width = this.renderer.domElement.clientWidth;
            const height = this.renderer.domElement.clientHeight;

            const frustumHeight = camera.top - camera.bottom;
            const frustumWidth = frustumHeight * (width / height);

            const centerX = (camera.left + camera.right) / 2;
            const centerY = (camera.top + camera.bottom) / 2;

            camera.left = centerX - frustumWidth / 2;
            camera.right = centerX + frustumWidth / 2;
            camera.top = centerY + frustumHeight / 2;
            camera.bottom = centerY - frustumHeight / 2;

            camera.updateProjectionMatrix();
        }
    }
    //!SECTION - PRIVATE METHODS
}