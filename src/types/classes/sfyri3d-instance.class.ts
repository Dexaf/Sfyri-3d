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

    //SECTION - HANDLING FOR ANIMATION LOOP
    /** the timer will be created in the startRender method */
    private _timer!: Timer;

    /** used to calcuate the time between frame in render cycle */
    private _timeToPassBetweenFrames: number = 1000 / 60;

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
        this._timeToPassBetweenFrames = 1000 / targetFps;
    }

    private _timeSinceLastFrame: number = 0;

    /** When not null, the animation is going on */
    private _animationFrameId: number | null = null;
    public get isRenderingOn(): boolean {
        return this._animationFrameId !== null;
    }
    //!SECTION - HANDLING FOR ANIMATION LOOP

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

        //SECTION - START ANIMATION LOOP
        this._timer = new Timer();
        //NOTE - we use connect to avoid timer to continue counting time when the page goes out of focus
        this._timer.connect(this.renderer.domElement.ownerDocument);
        this.renderNextStep();
        //!SECTION - START ANIMATION LOOP
        //TODO decide loop pipeline
        //TODO handle three js assets presence
    }

    /**
     * @throws This method can throw error.
     * @summary Stops the render only if it's on, else throws an error.
     */
    public stopRender() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        } else {
            throw new Error(`SFYRI - Sfyri3DInstance stopRender\nThis instance is not rendering.`);
        }
    }

    /**
     * @throws This method can throw error.
     * @summary Stops the render only if it's on, else throws an error.
     * Then it dispose of all the assets REFERENCED IN THE INSTANCE.
     */
    public killRender() {
        try {
            this.stopRender();
        } catch (error) {
            throw new Error(`SFYRI - Sfyri3DInstance stopRender\nThis instance is not rendering.`);

        }
        //TODO - dispose of all the assets...
    }
    //!SECTION - PUBLIC METHODS

    //SECTION - PRIVATE METHODS
    /**
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

    /**
     * Handles all the processes pipeline/lifecycle
     * around the render step using the calculated framerate.
     * Auto calls the next step by itself. 
     */
    private renderNextStep() {
        this._timer.update();
        this._timeSinceLastFrame = this._timer.getElapsed();
        if (this._timer.getElapsed() - this._timeSinceLastFrame >= this._timeToPassBetweenFrames) {
            this.preRenderingLogic();
            this.preRenderingAnimation();
            for (let i = 0; i < this.cameras.length; i++)
                this.renderer.render(this.scene, this.cameras[i]);
            this.postRenderingLogic();
            this.postRenderingAnimation();
        }
        this._animationFrameId = requestAnimationFrame(this.renderNextStep);
    }

    //SECTION - RENDER STEP LIFECYCLE METHODS
    //NOTE -    they are written in order of use: pre animation > pre logic > post animation > post logic.
    //          The pipeline flows like this to make eventual collision masks updated for the logic checks.
    preRenderingAnimation() {
        throw new Error("Method not implemented.");
    }
    preRenderingLogic() {
        throw new Error("Method not implemented.");
    }

    postRenderingAnimation() {
        throw new Error("Method not implemented.");
    }
    postRenderingLogic() {
        throw new Error("Method not implemented.");
    }
    //!SECTION - RENDER STEP LIFECYCLE METHODS

    //!SECTION - PRIVATE METHODS
}