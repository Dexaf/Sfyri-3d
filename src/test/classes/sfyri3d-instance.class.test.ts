import { BoxGeometry, DirectionalLight, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import createSfyri3DInstance from '../../utils/create-sfyri-3d-instance';
import Sfyri3DInstance from "../../types/classes/sfyri3d-instance.class";
import Sfyri3DEntity from "../../types/classes/sfyri3d-entity.class";

describe('Sfyri3DInstance', () => {
    let sfyri3DInstance: Sfyri3DInstance<null> | null = null;

    beforeEach(() => {
        const canvas = document.createElement('canvas');
        canvas.id = "mock-canvas"
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);
        sfyri3DInstance = createSfyri3DInstance(
            canvas,
            (container) => [new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)],
            null,
            null
        );
    });

    //NOTE: every start render send an animation frame request which lives parallel to the tests
    //      this thing creates dangling references and breaks the tests once every two iteration
    //      the code under here allow us to cancel the request
    afterEach(() => {
        if (sfyri3DInstance?.isRenderingOn) {
            sfyri3DInstance.stopRender();
        }
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
        const spyOnPreRenderingAnimation = vi.spyOn(sfyri3DInstance! as any, 'preRenderingAnimationMethodsExecution');
        const spyOnPreRenderingLogic = vi.spyOn(sfyri3DInstance! as any, 'preRenderingLogicMethodsExecution');

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
        const spyOnPreRenderingAnimation = vi.spyOn(sfyri3DInstance! as any, 'preRenderingAnimationMethodsExecution');
        const spyOnPreRenderingLogic = vi.spyOn(sfyri3DInstance! as any, 'preRenderingLogicMethodsExecution');

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

    //SECTION - ENTITIES HANDLING
    it("adds a Light entity correctly", () => {
        const lightEntity = new Sfyri3DEntity<DirectionalLight>(
            new DirectionalLight(),
            "test-light",
        );
        lightEntity.preRenderingLogicMethod = () => { };
        lightEntity.preRenderingAnimationMethod = () => { };

        //NOTE: no entity added so no methods
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);

        sfyri3DInstance!.addEntity(lightEntity);

        //expected status of entity
        expect(sfyri3DInstance!.getEntity(lightEntity.name, "light")).not.toBe(undefined);
        expect(sfyri3DInstance!.scene.children.includes(lightEntity.object)).toBe(true);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);
    });

    it("adds an Object3D entity correctly", () => {
        const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
        const objectEntity = new Sfyri3DEntity<Object3D>(
            mesh,
            "test-object",
        );
        objectEntity.preRenderingLogicMethod = () => { };
        objectEntity.preRenderingAnimationMethod = () => { };

        //NOTE: no entity added so no methods
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);

        sfyri3DInstance!.addEntity(objectEntity);

        //expected status of entity
        expect(sfyri3DInstance!.getEntity(objectEntity.name, "object3D")).not.toBe(undefined);
        expect(sfyri3DInstance!.scene.children.includes(objectEntity.object)).toBe(true);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);
    });

    it("removes a Light entity correctly", () => {
        const light = new DirectionalLight();
        const shadowDispose = vi.fn();
        (light as any).shadow = { map: { dispose: shadowDispose } };

        const lightEntity = new Sfyri3DEntity<DirectionalLight>(
            light,
            "test-light",
        );
        lightEntity.preRenderingLogicMethod = () => { };
        lightEntity.preRenderingAnimationMethod = () => { };

        //check before removing
        sfyri3DInstance!.addEntity(lightEntity);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);

        //check after removing that everything is disposed
        const result = sfyri3DInstance!.removeEntity("test-light", "light");
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);
        expect(result).toBe(true);
        expect(sfyri3DInstance!["_lights"].has("test-light")).toBe(false);
        expect(sfyri3DInstance!.scene.children.includes(light)).toBe(false);
        expect(shadowDispose).toHaveBeenCalled();
    });

    it("removes an Object3D entity correctly with disposal", () => {
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial();
        const mesh = new Mesh(geometry, material);

        const objectEntity = new Sfyri3DEntity<Object3D>(
            mesh,
            "test-object",
        );
        objectEntity.preRenderingLogicMethod = () => { };
        objectEntity.preRenderingAnimationMethod = () => { };

        //check before removing
        sfyri3DInstance!.addEntity(objectEntity);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(1);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(1);

        const geometryDisposeSpy = vi.spyOn(geometry, "dispose");
        const materialDisposeSpy = vi.spyOn(material, "dispose");

        //check after removing that everything is disposed
        const result = sfyri3DInstance!.removeEntity("test-object", "object3D", true);
        expect(sfyri3DInstance!['_preRenderingAnimationMethods'].size).toBe(0);
        expect(sfyri3DInstance!['_preRenderingLogicMethods'].size).toBe(0);
        expect(result).toBe(true);
        expect(sfyri3DInstance!["_objects3D"].has("test-object")).toBe(false);
        expect(sfyri3DInstance!.scene.children.includes(mesh)).toBe(false);
        expect(geometryDisposeSpy).toHaveBeenCalled();
        expect(materialDisposeSpy).toHaveBeenCalled();
    });

    it("returns false if Object3D does not exist", () => {
        const result = sfyri3DInstance!.removeEntity("not-existing", "object3D");
        expect(result).toBe(false);
    });
    //!SECTION - ENTITIES HANDLING

    it("should stop the rendering and clean the memory from the entities", () => {
        // mock cancelAnimationFrame
        const cancelSpy = vi.spyOn(global, "cancelAnimationFrame").mockImplementation(() => { });

        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial();
        const mesh = new Mesh(geometry, material);
        const objectEntity = new Sfyri3DEntity<Object3D>(
            mesh,
            "test-object",
        );

        //check before removing
        sfyri3DInstance!.addEntity(objectEntity);

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

    //SECTION - PRE/POST PIPELINE HANDLING
    it("adds a pipeline process correctly", () => {
        const process = vi.fn();

        sfyri3DInstance!.addProcessToPipeline("test-pre", "pre", process);
        expect((sfyri3DInstance! as any)._prePipelineProcesses.has("test-pre")).toBe(true);

        sfyri3DInstance!.addProcessToPipeline("test-post", "post", process);
        expect((sfyri3DInstance! as any)._postPipelineProcesses.has("test-post")).toBe(true);
    });

    it("throws if a pipeline process with same key already exists", () => {
        const process = vi.fn();

        sfyri3DInstance!.addProcessToPipeline("duplicate", "pre", process);
        expect(() => {
            sfyri3DInstance!.addProcessToPipeline("duplicate", "pre", process);
        }).toThrow();

        //NOTE: a duplicate key in pre and post it's ok, maybe a bad design by
        //      the programmer who does it, but i feel like it should be possibile.
        sfyri3DInstance!.addProcessToPipeline("duplicate", "post", process);
        expect(() => {
            sfyri3DInstance!.addProcessToPipeline("duplicate", "post", process);
        }).toThrow();
    });

    it("removes a pre pipeline process correctly", () => {
        const process = vi.fn();

        //
        sfyri3DInstance!.addProcessToPipeline("test-pre", "pre", process);
        const resultPre = sfyri3DInstance!.removeProcessToPipeline("test-pre", "pre");
        expect(resultPre).toBe(true);
        expect((sfyri3DInstance! as any)._prePipelineProcesses.has("test-pre")).toBe(false);

        sfyri3DInstance!.addProcessToPipeline("test-post", "post", process);
        const resultPost = sfyri3DInstance!.removeProcessToPipeline("test-post", "post");
        expect(resultPost).toBe(true);
        expect((sfyri3DInstance! as any)._postPipelineProcesses.has("test-post")).toBe(false);
    });

    it("returns false when removing a non existing process", () => {
        const result = sfyri3DInstance!.removeProcessToPipeline("not-existing", "pre");

        expect(result).toBe(false);
    });

    it("executes pre and post pipeline processes during frame", () => {
        const preProcess = vi.fn();
        const postProcess = vi.fn();

        sfyri3DInstance!.addProcessToPipeline("pre-test", "pre", preProcess);
        sfyri3DInstance!.addProcessToPipeline("post-test", "post", postProcess);

        sfyri3DInstance!.startRender();

        // simuliamo il frame
        sfyri3DInstance!["_timer"].getElapsed = () => 17;

        sfyri3DInstance!["renderNextStep"]();

        expect(preProcess).toBeCalled();
        expect(postProcess).toBeCalled();
    });

    it("executes pipeline lifecycle in correct order", () => {
        const preProcess = vi.fn();
        const animationSpy = vi.spyOn(sfyri3DInstance! as any, "preRenderingAnimationMethodsExecution");
        const logicSpy = vi.spyOn(sfyri3DInstance! as any, "preRenderingLogicMethodsExecution");
        const postProcess = vi.fn();

        sfyri3DInstance!.addProcessToPipeline("pre-test", "pre", preProcess);
        sfyri3DInstance!.addProcessToPipeline("post-test", "post", postProcess);

        sfyri3DInstance!.startRender();

        //makes the time correct to enter in a frame moment
        sfyri3DInstance!["_timer"].getElapsed = () => 17;
        //calls render to get inside the frame
        sfyri3DInstance!["renderNextStep"]();

        //ensure pipeline flow is correct pre > anim > logic > post
        expect(preProcess).toHaveBeenCalledBefore(animationSpy);
        expect(animationSpy).toHaveBeenCalledBefore(logicSpy);
        expect(logicSpy).toHaveBeenCalledBefore(postProcess);
    });
    //!SECTION - PRE/POST PIPELINE HANDLING
});