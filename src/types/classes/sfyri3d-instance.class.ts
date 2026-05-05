import { Scene, Camera, WebGLRenderer, Timer, PerspectiveCamera, OrthographicCamera, Material, Object3D, Light, Mesh, DirectionalLight, PointLight, SpotLight } from "three";
import { isSfyri3DLightEntity, isSfyri3DObject3DEntity } from "../../utils/type-guards";
import { Sfyri3DEntity, Sfyri3DEntityTypes } from "./sfyri3d-entity.class";
import { assertSfyri3DState } from "../../utils/assertions";
import { Sfyri3DStateEntry } from "./sfyri3d-state.class";

/**
 * Entry point of the Sfyri 3D Framework handling system.
 * 
 * The type T represent the props interface, use it as per this example:
 * ```ts
    type keys = 'count' | 'label';

    interface ISfyri3DState extends Record<keys, Sfyri3DStateEntry<any>> {}

    const state: ISfyri3DState = {
        count: new Sfyri3DStateEntry<number>('count', 0),
        label: new Sfyri3DStateEntry<string>('label', 'hi'),
    };
 * ```
    and then pass ISfyri3DState as T, make it empty if you don't need a global state.
    those passage areneeded to have intellisense and guarantee that the methods
    that interact with the global state can access existing methods in the entries.

    NOTE: the key of the obj have to match the passed key in the constructor of Sfyri3DStateEntry
 */
export default class Sfyri3DInstance<T> {
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
    //NOTE: the timer will be created in the startRender method
    private _timer!: Timer;

    /** used to calcuate the time between frame in render cycle */
    private _timeToPassBetweenFrames: number = 1000 / 60;

    private _targetFps: number = 60;
    public get targetFps(): number {
        return this._targetFps;
    }
    /**
     * @param targetFps the fps you want to use as a ceiling for the render loop to target.
     * If you don't set it the default is 60fps.
     */
    public setTargetFps(targetFps: number) {
        this._targetFps = targetFps;
        this._timeToPassBetweenFrames = 1000 / targetFps;
    }

    private _timeSinceLastFrame: number = 0;

    /** Holds the request animation frame id, as such when not null, the animation is going on */
    private _animationFrameId: number | null = null;
    public get isRenderingOn(): boolean {
        return this._animationFrameId !== null;
    }
    //!SECTION - PROPS FOR ANIMATION LOOP

    /** holds the resize function ref passed to the addEventListener so we can remove it later */
    private _resizeEventFunctionRef: (() => void) | null = null;

    //SECTION - ENTITIES PROPS
    /** A global map to access materials across the instance
     * @reminder if you delete an entity that's an Object3D with a material, using the remove entity method
     * without the shouldDisposeMaterials property setted to false, the material will be disposed,
     * this means that all the other objects that use it by ref will be affected.
    */
    public materials: Map<string, Material>[] = [];

    //NOTE - the setters are handled in the private methods 
    private _objects3D: Map<string, Sfyri3DEntity<Object3D>> = new Map();
    private _lights: Map<string, Sfyri3DEntity<Light>> = new Map();
    //!SECTION - ENTITIES PROPS

    // GLOBAL STATE
    /** Used to share data along the instance */
    public state: T;

    //SECTION - PROCESSES PROPS
    /** map of processes that fires before executing the methods of the pipeline */
    private _prePipelineProcesses: Map<string, (sfyri3DInstanceRef: Sfyri3DInstance<T>) => void> = new Map();
    /** map of methods that handles simple movements and animation triggers */
    private _preRenderingAnimationMethods: Set<((sfyri3DInstanceRef: Sfyri3DInstance<T>) => void)> = new Set();
    /** map of methods that handles logic and may indirectly trigger animations and movements */
    private _preRenderingLogicMethods: Set<((sfyri3DInstanceRef: Sfyri3DInstance<T>) => void)> = new Set();
    /** map of processes that fires after executing the methods of the pipeline */
    private _postPipelineProcesses: Map<string, (sfyri3DInstanceRef: Sfyri3DInstance<T>) => void> = new Map();
    //!SECTION - PROCESSES PROPS
    //!SECTION - SFYRI3D PROPS

    //CONSTRUCTOR
    constructor(scene: Scene, renderer: WebGLRenderer, cameras: Camera[], initState: any) {
        //passed props assign
        this._scene = scene;
        this._renderer = renderer;
        if (cameras.length === 0)
            throw new Error(`SFYRI3D - Sfyri3DInstance Constructor\nNo camera where passed to the instance you wanted to create.`);

        this._cameras = cameras;

        //NOTE: this throws if the state is not null 
        //      or composed only of keys with value of type Sfyri3DStateEntry<>
        assertSfyri3DState(initState);
        this.state = initState as T;
    }

    //SECTION - PUBLIC METHODS
    //SECTION - RENDER HANDLING
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
    }

    /**
     * @throws This method can throw error.
     * @summary Stops the render only if it's on, else throws an error.
     */
    public stopRender() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        } else throw new Error(`SFYRI3D - Sfyri3DInstance stopRender\nThis instance is not rendering.`);
    }

    /**
     * @throws This method can throw error.
     * @shouldDisposeMaterials Dispose all the materials used in the scene, default false.
     * @summary Stops the render only if it's on, else throws an error. It then dispose of all the geometries and materials if asked.
     * The materials map is not directly touched, if you need to dispose of them, do it manually (be aware, if a material you placed in the
     * map is referenced by an entity that gets his material disposed you are going to lose it). 
     */
    public killRender(shouldDisposeMaterials: boolean = false) {
        try {
            this.stopRender();
        } catch (error) {
            throw new Error(`SFYRI3D - Sfyri3DInstance stopRender\nThis instance is not rendering.`);
        }

        this._objects3D.forEach(o3d => this.removeEntity(o3d.name, "object3D", shouldDisposeMaterials));
        this._lights.forEach(light => this.removeEntity(light.name, "light"));
    }
    //!SECTION - RENDER HANDLING

    //SECTION - SFYRI3D ENTITIES HANDLERS
    /**
     * @param name name of entity to search
     * @param sfyri3DEntityType type of the searched entity
     * @returns the entity if found, else undefined.
     */
    public getEntity(name: string, sfyri3DEntityType: 'light' | 'object3D'): Sfyri3DEntity<Object3D> | undefined {
        switch (sfyri3DEntityType) {
            case 'light':
                return this._lights.get(name);
            case 'object3D':
                return this._objects3D.get(name);
        }
    }

    /**
     * @throws This method can throw error.
     * @param entity entity to add with an object that either extends Light or Object3D
     * @summary this method add a valid Entities and registers the pipeline methods in the instance render pipeline
     */
    public addEntity(entity: Sfyri3DEntity<Sfyri3DEntityTypes>) {
        //NOTE -    check Light before Object3D as Light actually extends Object3D, 
        //          reversing the if makes it always fall in object3D if entity is valid.
        //LIGHTS
        if (isSfyri3DLightEntity(entity)) {
            if (this._lights.has(entity.name)) throw new Error(`SFYRI3D - Sfyri3DInstance addEntity\n${entity.name} already exists in the lights entity's map.`);
            this._lights.set(entity.name, entity);
        }
        //OBJECTS 3D
        else if (isSfyri3DObject3DEntity(entity)) {
            if (this._objects3D.has(entity.name)) throw new Error(`SFYRI3D - Sfyri3DInstance addEntity\n${entity.name} already exists in the objects3Ds entity's map.`);
            this._objects3D.set(entity.name, entity);
        }
        //ERROR
        else throw new Error(`SFYRI3D - Sfyri3DInstance addEntity\n${(entity as any).name ?? "ND"} doesn't extends either object3D or light.`);

        this.scene.add(entity.object);

        //PIPELINE METHODS
        if (entity.preRenderingAnimationMethod)
            this._preRenderingAnimationMethods.add(entity.preRenderingAnimationMethod);
        if (entity.preRenderingLogicMethod)
            this._preRenderingLogicMethods.add(entity.preRenderingLogicMethod);
    }

    /**
     * @param name name of the entity
     * @param sfyri3DEntityType type used to check which map to use 
     * @param shouldDisposeMaterials if removing an object3D it's checked to dispose the materials
     * @returns if the removed entity existed returns true
     * @summary remove an entity from the scene and unregister the pipeline methods in the instance render pipeline.
     * if it's a light it disposes of eventual shadowmap, if it's an object3D it disposes of the geometry and if asked the materials too.
     */
    public removeEntity(name: string, sfyri3DEntityType: 'light' | 'object3D', shouldDisposeMaterials: boolean = false): boolean {
        switch (sfyri3DEntityType) {
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

                    //REMOVE PIPELINE METHODS
                    if (light.preRenderingAnimationMethod)
                        this._preRenderingAnimationMethods.delete(light.preRenderingAnimationMethod);
                    if (light.preRenderingLogicMethod)
                        this._preRenderingLogicMethods.delete(light.preRenderingLogicMethod);
                    //REMOVE SUBSCRIPTIONS
                    if (light.stateEntrySubscriptions)
                        this.cleanSubscriptions(light.name, light.stateEntrySubscriptions);
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

                //REMOVE PIPELINE METHODS
                if (object3D.preRenderingAnimationMethod)
                    this._preRenderingAnimationMethods.delete(object3D.preRenderingAnimationMethod);
                if (object3D.preRenderingLogicMethod)
                    this._preRenderingLogicMethods.delete(object3D.preRenderingLogicMethod);
                //REMOVE SUBSCRIPTIONS
                if (object3D.stateEntrySubscriptions)
                    this.cleanSubscriptions(object3D.name, object3D.stateEntrySubscriptions);

                //REMOVE FROM INSTANCE MAP
                return this._objects3D.delete(name);
        }
    }
    //!SECTION - SFYRI3D ENTITIES HANDLERS

    //SECTION - SFYRI3D PROCESSES HANDLERS
    /**
     * @throws This method can throw error.
     * @param key name of the process setted in the pipeline.
     * @param type type of process, can be "pre" or "post".
     * @param process the process that get fired at the moment that get decided by the type
     * @summary add a function to the step pipeline, with "pre" type it will be excuted before the animation and logic step,
     * with "post" it gets executed after those steps. For cleanliness purpose you can't have doubles in the same type group,
     * trying to do so will raise an error.
     */
    public addProcessToPipeline(key: string, type: "pre" | "post", process: (sfyri3DInstance: Sfyri3DInstance<T>) => void) {
        switch (type) {
            case "pre":
                if (this._prePipelineProcesses.has(key)) throw new Error(`SFYRI3D - Sfyri3DInstance addProcessToPipeline\n${key} already exists in the pre pipeline processes's map.`)
                this._prePipelineProcesses.set(key, process);
                break;
            case "post":
                if (this._postPipelineProcesses.has(key)) throw new Error(`SFYRI3D - Sfyri3DInstance addProcessToPipeline\n${key} already exists in the post pipeline processes's map.`)
                this._postPipelineProcesses.set(key, process);
                break;
        }
    }

    /**
     * @param key name of the process to delete in the pipeline.
     * @param type type of process, can be "pre" or "post".
     * @returns true if deletes the process, false if there where no instance of the process in the group
     * of the type used as parameter.
     */
    public removeProcessToPipeline(key: string, type: "pre" | "post"): boolean {
        switch (type) {
            case "pre":
                return this._prePipelineProcesses.delete(key);
            case "post":
                return this._postPipelineProcesses.delete(key);
        }
    }
    //!SECTION - SFYRI3D PROCESSES HANDLERS
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
    private renderNextStep = () => {
        this._timer.update();

        if (this._timer.getElapsed() - this._timeSinceLastFrame >= this._timeToPassBetweenFrames) {
            this.prePipelineProcessesExecution();
            this.preRenderingAnimationMethodsExecution();
            this.preRenderingLogicMethodsExecution();
            this.postPipelineProcessesExecution();

            for (let i = 0; i < this.cameras.length; i++)
                this.renderer.render(this.scene, this.cameras[i]);
        }

        this._timeSinceLastFrame = this._timer.getElapsed();
        this._animationFrameId = requestAnimationFrame(this.renderNextStep);
    }

    //SECTION - RENDER STEP LIFECYCLE METHODS
    //NOTE -    The methods are written in order of use: pre pipeline > pre animation > pre logic > post pipeline.
    //          The pipeline flows like this to make eventual collision masks updated for the logic checks.
    private prePipelineProcessesExecution() {
        this._prePipelineProcesses.forEach(method => method(this));
    }
    private preRenderingAnimationMethodsExecution() {
        this._preRenderingAnimationMethods.forEach(method => method(this));
    }
    private preRenderingLogicMethodsExecution() {
        this._preRenderingLogicMethods.forEach(method => method(this));
    }
    private postPipelineProcessesExecution() {
        this._postPipelineProcesses.forEach(method => method(this));
    }
    //!SECTION - RENDER STEP LIFECYCLE METHODS

    private cleanSubscriptions(entityName: string, stateEntrySubscriptions: Set<string>) {
        stateEntrySubscriptions.forEach(sub => {
            const entry = (this.state as ISfyri3DState)[sub];
            if (entry)
                //NOTE: we need false into shouldDeleteEntry to avoid breaking the for loop
                entry.unsubscribe(entityName, stateEntrySubscriptions, false);
        })
        //remove the entries
        stateEntrySubscriptions.clear();
    }
    //!SECTION - PRIVATE METHODS
}

interface ISfyri3DState {
    [key: string]: Sfyri3DStateEntry<any>;
}