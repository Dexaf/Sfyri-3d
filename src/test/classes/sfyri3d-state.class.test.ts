import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sfyri3DStateEntry } from "../../types/classes/sfyri3d-state.class";
import { BoxGeometry, MeshBasicMaterial, Mesh, Object3D } from "three";
import Sfyri3DEntity from "../../types/classes/sfyri3d-entity.class";

describe('Sfyri3DStateEntry', () => {
    let stateEntry: Sfyri3DStateEntry<{ count: number; label: string }> | null = null;
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial();
    const mesh = new Mesh(geometry, material);

    const entity = new Sfyri3DEntity<Object3D>(mesh, 'test-object');
    entity.preRenderingAnimationMethod = () => { };
    entity.preRenderingLogicMethod = () => { };
    entity.stateEntrySubscriptions = new Set();

    const entity2 = new Sfyri3DEntity<Object3D>(mesh, 'test-object-2');
    entity.preRenderingAnimationMethod = () => { };
    entity.preRenderingLogicMethod = () => { };
    entity2.stateEntrySubscriptions = new Set();

    beforeEach(() => {
        stateEntry = new Sfyri3DStateEntry<{ count: number; label: string }>(
            'key',
            {
                count: 0,
                label: "initial"
            });
        entity.stateEntrySubscriptions = new Set();
        entity2.stateEntrySubscriptions = new Set();

    });

    //SECTION - SUBSCRIBE / SET VALUE
    it("calls a single subscribed callback when value updates", () => {
        const spy = vi.fn();

        stateEntry!.subscribe("observer-1", spy, entity.stateEntrySubscriptions!);

        //check internal map created
        expect(stateEntry!["_subscribed"]).not.toBeNull();
        expect(stateEntry!["_subscribed"]!.size).toBe(1);

        stateEntry!.setValue({ count: 1 });

        expect(spy).toBeCalledTimes(1);
    });

    it("calls multiple subscribed callbacks when value updates", () => {
        const spy1 = vi.fn();
        const spy2 = vi.fn();

        stateEntry!.subscribe(entity.name, spy1, entity.stateEntrySubscriptions!);
        stateEntry!.subscribe(entity2.name, spy2, entity2.stateEntrySubscriptions!);

        expect(stateEntry!["_subscribed"]!.size).toBe(2);

        stateEntry!.setValue({ count: 10 });

        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
    });

    it("does not call callbacks if shouldSendUpdate is false", () => {
        const spy = vi.fn();

        stateEntry!.subscribe(entity.name, spy, entity.stateEntrySubscriptions!);

        stateEntry!.setValue({ count: 5 }, false);

        expect(spy).not.toBeCalled();
    });

    it("does not throw and does not call anything if no subscribers exist", () => {
        const spy = vi.spyOn(stateEntry!, 'sendUpdate');
        expect(stateEntry!["_subscribed"]).toBeNull();

        stateEntry!.setValue({ count: 3 });

        expect(spy).not.toBeCalled();
    });

    it("calls callbacks on two consecutive updates with different values", () => {
        const spy = vi.fn(() => {
            return stateEntry!.value.count;
        });

        stateEntry!.subscribe(entity.name, spy, entity.stateEntrySubscriptions!);

        stateEntry!.setValue({ count: 1 });
        stateEntry!.setValue({ count: 2 });

        expect(spy).toBeCalledTimes(2);

        //NOTE: here value is the return of the function called
        //      in the sendupdate
        expect(spy.mock.results[0].value).toBe(1);
        expect(spy.mock.results[1].value).toBe(2);
    });
    //!SECTION - SUBSCRIBE / SET VALUE


    //SECTION - UNSUBSCRIBE
    it("unsubscribes correctly and stops receiving updates", () => {
        const spy = vi.fn();

        stateEntry!.subscribe(entity.name, spy, entity.stateEntrySubscriptions!);

        const result = stateEntry!.unsubscribe(entity.name, entity.stateEntrySubscriptions!);

        expect(result).toBe(true);
        expect(stateEntry!["_subscribed"]).toBeNull();

        stateEntry!.setValue({ count: 100 });

        expect(spy).not.toBeCalled();
    });

    it("returns false when unsubscribing a non-existing observer", () => {
        const result = stateEntry!.unsubscribe("not-existing", entity.stateEntrySubscriptions!);

        expect(result).toBe(false);
    });
    //!SECTION - UNSUBSCRIBE


    //SECTION - SEND UPDATE
    it("sendUpdate manually triggers subscribed callbacks", () => {
        const spy1 = vi.fn();
        const spy2 = vi.fn();

        stateEntry!.subscribe(entity.name, spy1, entity.stateEntrySubscriptions!);
        stateEntry!.subscribe(entity2.name, spy2, entity2.stateEntrySubscriptions!);

        stateEntry!.sendUpdate();

        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
    });

    it("sendUpdate does nothing if no subscribers exist", () => {
        expect(stateEntry!["_subscribed"]).toBeNull();

        stateEntry!.sendUpdate();

        expect(stateEntry!["_subscribed"]).toBeNull();
    });
    //!SECTION - SEND UPDATE
});