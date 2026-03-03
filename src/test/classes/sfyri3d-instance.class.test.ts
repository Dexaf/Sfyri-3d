import { BoxGeometry, DirectionalLight, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import createSfyri3DInstance from "../..";
import Sfyri3DInstance from "../../types/classes/sfyri3d-instance.class";
import ISfyri3DAsset from "../../types/interfaces/sfyri3d-asset.interface";

describe('Sfyri3DInstance', () => {
    let sfyri3DInstance: Sfyri3DInstance | null = null;

    beforeEach(() => {
        const canvas = document.createElement('canvas');
        canvas.id = "mock-canvas"
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);
        sfyri3DInstance = createSfyri3DInstance(
            canvas,
            (container) => [new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)]
        );
    });

    //SECTION - RENDER NEXT STEP
    it('should start at least one step if everything is correct', () => {
        const spy = vi.spyOn(sfyri3DInstance! as any, 'renderNextStep');
        sfyri3DInstance!.startRender();
        expect(spy).toBeCalled();
    })

    it('should loop the rendering cycle', () => {
        const spyOnRenderNextStep = vi.spyOn(sfyri3DInstance! as any, 'renderNextStep');
        sfyri3DInstance!.startRender();
        expect(spyOnRenderNextStep).toBeCalled();
        //NOTE: animation frame id is saved every time a new animation frame is called. 
        //      At every animation frame we loop renderNextStep.
        expect(sfyri3DInstance!['_animationFrameId']).not.toBe(null);
    })

    it('should loop the rendering cycle', () => {
        const spyOnRenderNextStep = vi.spyOn(sfyri3DInstance! as any, 'renderNextStep');
        sfyri3DInstance!.startRender();
        expect(spyOnRenderNextStep).toBeCalled();
        //NOTE: animation frame id is saved every time a new animation frame is called. 
        //      At every animation frame we loop renderNextStep.
        expect(sfyri3DInstance!['_animationFrameId']).not.toBe(null);
    })

    it('fires the pipeline methods only during in the frame window in the correct order', () => {
        const spyOnPreRenderingAnimation = vi.spyOn(sfyri3DInstance! as any, 'preRenderingAnimation');
        const spyOnPreRenderingLogic = vi.spyOn(sfyri3DInstance! as any, 'preRenderingLogic');

        sfyri3DInstance!.startRender();

        //NOTE - getElapsed should be ~0 so we can't be inside the first frame
        expect(spyOnPreRenderingAnimation).not.toBeCalled()
        expect(spyOnPreRenderingLogic).not.toBeCalled()

        //NOTE - standard fps is 60, so we get 17ms between frames
        sfyri3DInstance!['_timer'].getElapsed = () => 17 //ms;

        //call again, should be inside a frame now
        sfyri3DInstance!['renderNextStep']();

        expect(spyOnPreRenderingAnimation).toBeCalled()
        expect(spyOnPreRenderingLogic).toBeCalled()

        expect(spyOnPreRenderingAnimation).toHaveBeenCalledBefore(spyOnPreRenderingLogic)
    })

    it('fires the frame with a different fps at the correct time', () => {
        const spyOnPreRenderingAnimation = vi.spyOn(sfyri3DInstance! as any, 'preRenderingAnimation');
        const spyOnPreRenderingLogic = vi.spyOn(sfyri3DInstance! as any, 'preRenderingLogic');

        sfyri3DInstance!.setTargetFps(30);
        sfyri3DInstance!.startRender();

        //NOTE - getElapsed should be ~0 so we can't be inside the first frame
        expect(spyOnPreRenderingAnimation).not.toBeCalled()
        expect(spyOnPreRenderingLogic).not.toBeCalled()

        //NOTE - new fps is 30, so we get 34ms between frames
        sfyri3DInstance!['_timer'].getElapsed = () => 34 //ms;

        //call again, should be inside a frame now
        sfyri3DInstance!['renderNextStep']();

        expect(spyOnPreRenderingAnimation).toBeCalled()
        expect(spyOnPreRenderingLogic).toBeCalled()
    })

    it("cancels the animation frame if rendering", () => {
        // mock cancelAnimationFrame
        const cancelSpy = vi.spyOn(global, "cancelAnimationFrame").mockImplementation(() => { });

        sfyri3DInstance!.startRender();
        expect(sfyri3DInstance!["_animationFrameId"]).not.toBeNull();

        sfyri3DInstance!.stopRender();
        expect(sfyri3DInstance!["_animationFrameId"]).toBeNull();

        cancelSpy.mockRestore();
    });
    //!SECTION - RENDER NEXT STEP

    //SECTION - ASSETS HANDLING
    it("adds a Light asset correctly", () => {
        const lightAsset: ISfyri3DAsset<DirectionalLight> = {
            name: "test-light",
            object: new DirectionalLight(),
            properties: {},
            preRenderingAnimationMethod: () => { },
            preRenderingLogicMethod: () => { }
        };

        //NOTE: no asset added so no methods
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);

        sfyri3DInstance!.addAsset(lightAsset);

        //expected status of asset
        expect(sfyri3DInstance!.getAsset(lightAsset.name, "light")).not.toBe(undefined);
        expect(sfyri3DInstance!.scene.children.includes(lightAsset.object)).toBe(true);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);
    });

    it("adds an Object3D asset correctly", () => {
        const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
        const objectAsset: ISfyri3DAsset<Object3D> = {
            name: "test-object",
            object: mesh,
            properties: {},
            preRenderingAnimationMethod: () => { },
            preRenderingLogicMethod: () => { }
        };

        //NOTE: no asset added so no methods
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);

        sfyri3DInstance!.addAsset(objectAsset);

        //expected status of asset
        expect(sfyri3DInstance!.getAsset(objectAsset.name, "object3D")).not.toBe(undefined);
        expect(sfyri3DInstance!.scene.children.includes(objectAsset.object)).toBe(true);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);
    });

    it("removes a Light asset correctly", () => {
        const light = new DirectionalLight();
        const shadowDispose = vi.fn();
        (light as any).shadow = { map: { dispose: shadowDispose } };

        const lightAsset: ISfyri3DAsset<DirectionalLight> = {
            name: "test-light",
            object: light,
            properties: {},
            preRenderingAnimationMethod: () => { },
            preRenderingLogicMethod: () => { }
        };

        //check before removing
        sfyri3DInstance!.addAsset(lightAsset);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);

        //check after removing that everything is disposed
        const result = sfyri3DInstance!.removeAsset("test-light", "light");
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);
        expect(result).toBe(true);
        expect(sfyri3DInstance!["_lights"].has("test-light")).toBe(false);
        expect(sfyri3DInstance!.scene.children.includes(light)).toBe(false);
        expect(shadowDispose).toHaveBeenCalled();
    });

    it("removes an Object3D asset correctly with disposal", () => {
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial();
        const mesh = new Mesh(geometry, material);

        const objectAsset: ISfyri3DAsset<Object3D> = {
            name: "test-object",
            object: mesh,
            properties: {},
            preRenderingAnimationMethod: () => { },
            preRenderingLogicMethod: () => { }
        };

        //check before removing
        sfyri3DInstance!.addAsset(objectAsset);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);

        const geometryDisposeSpy = vi.spyOn(geometry, "dispose");
        const materialDisposeSpy = vi.spyOn(material, "dispose");

        //check after removing that everything is disposed
        const result = sfyri3DInstance!.removeAsset("test-object", "object3D", true);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);
        expect(result).toBe(true);
        expect(sfyri3DInstance!["_objects3D"].has("test-object")).toBe(false);
        expect(sfyri3DInstance!.scene.children.includes(mesh)).toBe(false);
        expect(geometryDisposeSpy).toHaveBeenCalled();
        expect(materialDisposeSpy).toHaveBeenCalled();
    });

    it("returns false if Object3D does not exist", () => {
        const result = sfyri3DInstance!.removeAsset("not-existing", "object3D");
        expect(result).toBe(false);
    });
    //!SECTION - ASSETS HANDLING

    it("should stop the rendering and clean the memory from the assets", () => {
        // mock cancelAnimationFrame
        const cancelSpy = vi.spyOn(global, "cancelAnimationFrame").mockImplementation(() => { });

        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial();
        const mesh = new Mesh(geometry, material);

        const objectAsset: ISfyri3DAsset<Object3D> = {
            name: "test-object",
            object: mesh,
            properties: {},
            preRenderingAnimationMethod: () => { },
            preRenderingLogicMethod: () => { }
        };

        //check before removing
        sfyri3DInstance!.addAsset(objectAsset);

        sfyri3DInstance!.startRender();

        const geometryDisposeSpy = vi.spyOn(geometry, "dispose");
        const materialDisposeSpy = vi.spyOn(material, "dispose");

        sfyri3DInstance!.killRender(true);

        //check after removing that everything is disposed
        //object was cleaned
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);
        expect(sfyri3DInstance!["_objects3D"].has("test-object")).toBe(false);
        expect(sfyri3DInstance!.scene.children.includes(mesh)).toBe(false);
        expect(geometryDisposeSpy).toHaveBeenCalled();
        expect(materialDisposeSpy).toHaveBeenCalled();
        //rendering was stopped
        expect(sfyri3DInstance!["_animationFrameId"]).toBeNull();

        cancelSpy.mockRestore();
    })
});