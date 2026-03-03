import { Scene, Camera, WebGLRenderer, Timer, PerspectiveCamera, OrthographicCamera, Material, Object3D, Light, Mesh, DirectionalLight, PointLight, SpotLight } from "three";
import ISfyri3DAsset, { Sfyri3DAssetTypes } from "../interfaces/sfyri3d-asset.interface";
import { isLightAsset as isSfyri3DLightAsset, isObject3DAsset as isSfyri3DObject3DAsset } from "../../utils/type-guards";

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

    //SECTION - PROPS FOR ANIMATION LOOP
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
    //!SECTION - PROPS FOR ANIMATION LOOP

    /** holds the resize function ref passed to the addEventListener so we can remove it later */
    private _resizeEventFunctionRef: (() => void) | null = null;

    //SECTION - ASSETS PROPS
    public materials: Map<string, Material>[] = [];
    //NOTE - the setters are handled in the private methods 
    private _objects3D: Map<string, ISfyri3DAsset<Object3D>> = new Map();
    private _lights: Map<string, ISfyri3DAsset<Light>> = new Map();
    //!SECTION - ASSETS PROPS

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
     * @shouldDisposeMaterials Dispose all the materials used in the scene, default false.
     * @summary Stops the render only if it's on, else throws an error. It then dispose of all the geometries and materials if asked.
     * The materials map is not directly touched, if you need to dispose of them, do it manually (be aware, if a material you placed in the
     * map is referenced by an asset that gets his material disposed you are going to lose it). 
     */
    public killRender(shouldDisposeMaterials: boolean = false) {
        try {
            this.stopRender();
        } catch (error) {
            throw new Error(`SFYRI - Sfyri3DInstance stopRender\nThis instance is not rendering.`);
        }

        this._objects3D.forEach(o3d => this.removeAsset(o3d.name, "object3D", shouldDisposeMaterials));
        this._lights.forEach(light => this.removeAsset(light.name, "light"));
    }

    //SECTION - SFYRI3D ASSETS HANDLERS
    /**
     * @param name name of asset to search
     * @param sfyri3DAssetType type of the searched asset
     * @returns the asset if found, else undefined.
     */
    public getAsset(name: string, sfyri3DAssetType: 'light' | 'object3D'): ISfyri3DAsset<Object3D> | undefined {
        switch (sfyri3DAssetType) {
            case 'light':
                return this._lights.get(name);
            case 'object3D':
                return this._objects3D.get(name);
        }
    }

    /**
     * @param asset asset to add with an object that either extends Light or Object3D
     * @summary this method add a valid assets and registers the pipeline methods in the instance render pipeline
     */
    public addAsset(asset: ISfyri3DAsset<Sfyri3DAssetTypes>) {
        //NOTE -    check Light before Object3D as Light actually extends Object3D, 
        //          reversing the if makes it always fall in object3D if asset is valid.
        //LIGHTS
        if (isSfyri3DLightAsset(asset)) {
            if (this._lights.has(asset.name)) throw new Error(`SFYRI - Sfyri3DInstance addAsset\n${asset.name} already exists in the lights asset's map.`);
            this._lights.set(asset.name, asset);
        }
        //OBJECTS 3D
        else if (isSfyri3DObject3DAsset(asset)) {
            if (this._objects3D.has(asset.name)) throw new Error(`SFYRI - Sfyri3DInstance addAsset\n${asset.name} already exists in the objects3Ds asset's map.`);
            this._objects3D.set(asset.name, asset);
        } else throw new Error(`SFYRI - Sfyri3DInstance addAsset\n${asset.name} doesn't extends either object3D or light.`);
    }

    /**
     * @summary remove an asset from the scene and unregister the pipeline methods in the instance render pipeline.
     * if it's a light it disposes of eventual shadowmap, if it's an object3D it disposes of the geometry and if asked the materials too.
     * @param name name of the asset
     * @param sfyri3DAssetType type used to check which map to use 
     * @param shouldDisposeMaterials if removing an object3D it's checked to dispose the materials
     * @returns if the removed asset existed returns true
     */
    public removeAsset(name: string, sfyri3DAssetType: 'light' | 'object3D', shouldDisposeMaterials: boolean = false): boolean {
        switch (sfyri3DAssetType) {
            //REMOVE LIGHT
            case 'light':
                this._lights.forEach(light => {
                    if (light.object instanceof DirectionalLight ||
                        light.object instanceof SpotLight ||
                        light.object instanceof PointLight) {
                        if (light.object.shadow?.map) {
                            light.object.shadow.map.dispose();
                        }
                    }
                    this.scene.remove(light.object);
                });
                return this._lights.delete(name);

            //REMOVE OBJECT3D
            case 'object3D':
                const object3D = this._objects3D.get(name);
                if (!object3D) return false;
                //DISPOSE OF RESOURCE
                object3D.object.traverse(child => {
                    if ((child as Mesh).isMesh) {
                        const meshChild = (child as Mesh);

                        //GEOMETRY DISPOSE
                        meshChild.geometry.dispose();

                        //MATERIAL DISPOSE
                        if (shouldDisposeMaterials)
                            if (meshChild.material instanceof Material)
                                meshChild.material.dispose();

                            else
                                for (let j = 0; j < meshChild.material.length; j++)
                                    meshChild.material[j].dispose();
                    }
                });
                //REMOVE FROM SCENE
                this.scene.remove(object3D.object);
                //REMOVE FROM INSTANCE MAP
                return this._objects3D.delete(name);
        }
    }
    //!SECTION - SFYRI3D ASSETS HANDLERS
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
        }
        this._animationFrameId = requestAnimationFrame(this.renderNextStep);
    }

    //SECTION - RENDER STEP LIFECYCLE METHODS
    //NOTE -    they are written in order of use: pre animation > pre logic.
    //          The pipeline flows like this to make eventual collision masks updated for the logic checks.
    preRenderingAnimation() {
        throw new Error("Method not implemented.");
    }
    preRenderingLogic() {
        throw new Error("Method not implemented.");
    }
    //!SECTION - RENDER STEP LIFECYCLE METHODS

    //!SECTION - PRIVATE METHODS
}