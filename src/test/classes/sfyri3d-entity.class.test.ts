import { beforeEach, describe, expect, it, vi } from "vitest";
import Sfyri3DInstance from "../../types/classes/sfyri3d-instance.class";
import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera } from "three";
import createSfyri3DInstance from "../..";
import Sfyri3DEntity from "../../types/classes/sfyri3d-entity.class";
import { Sfyri3DStateEntry } from "../../types/classes/sfyri3d-state.class";

type keys = 'count';

export interface ISfyri3DState extends Record<keys, Sfyri3DStateEntry<any>> { }

describe('Sfyri3dEntity', () => {
    let sfyri3DInstance: Sfyri3DInstance<ISfyri3DState> | null = null;

    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial();
    const mesh = new Mesh(geometry, material);

    const entity = new Sfyri3DEntity<Object3D>(mesh, 'test-object');
    entity.preRenderingAnimationMethod = () => { };
    entity.preRenderingLogicMethod = () => { };
    entity.stateEntrySubscriptions = new Set();

    beforeEach(() => {
        const canvas = document.createElement('canvas');
        canvas.id = "mock-canvas"
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);

        const state: ISfyri3DState = {
            count: new Sfyri3DStateEntry<number>('count', 0),
        };

        sfyri3DInstance = createSfyri3DInstance(
            canvas,
            (container) => [new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)],
            null,
            state
        );
    });

    it('should unsubscribe to the state entry on delete and not be called', () => {
        const spy = vi.fn(() => { });
        sfyri3DInstance!.addEntity(entity);
        sfyri3DInstance!.state.count.subscribe(entity.name, spy, entity.stateEntrySubscriptions!);

        sfyri3DInstance!.state.count.sendUpdate();
        expect(spy).toBeCalledTimes(1);

        sfyri3DInstance!.removeEntity(entity.name, "object3D");
        sfyri3DInstance!.state.count.sendUpdate();
        expect(spy).not.toBeCalledTimes(2);
    })
})