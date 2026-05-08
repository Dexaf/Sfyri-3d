import { describe, it, expect, beforeAll } from 'vitest';
import { PerspectiveCamera } from 'three';
import { createSfyri3DInstance } from '../../utils/create-sfyri-3d-instance'

describe('CreateSfyri3DInstance', () => {
    let canvas: HTMLCanvasElement;
    let camera: PerspectiveCamera | null;

    beforeAll(() => {
        canvas = document.createElement('canvas');
        canvas.id = "mock-canvas"
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);
        camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    });

    //SECTION - CORRECT BEHAVIOUR
    it('should create a valid Sfyri3DInstance', () => {
        const instance = createSfyri3DInstance<null>(
            canvas,
            (container) => [new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)],
            null,
            null,
        );

        //With right input it should be not null
        expect(instance).not.toBe(null);
        //Have at least one camera created with the factory method correctly
        expect(instance.cameras.length).toBeGreaterThan(0);
    });

    it('should create a valid Sfyri3DInstance by searching the canvas from query selector', () => {
        const instance = createSfyri3DInstance<null>(
            "#mock-canvas",
            (container) => [camera!],
            null,
            null,
        );

        expect(instance).not.toBe(null);
    });
    //!SECTION - CORRECT BEHAVIOUR 

    //SECTION - STOP BREAKING BEHAVIOUR
    it('should throw if no final canvas is passed', () => {
        expect(() => createSfyri3DInstance<null>(
            null as unknown as HTMLCanvasElement,
            () => [camera!],
            null,
            null,
        )).toThrow();
    });

    it('should throw if query selector does not match any element', () => {
        expect(() => createSfyri3DInstance<null>(
            '#non-existent-canvas',
            () => [camera!],
            null,
            null,
        )).toThrow();
    });

    it('should throw if camera factory returns empty array', () => {
        expect(() => createSfyri3DInstance<null>(
            canvas,
            () => [],
            null,
            null,
        )).toThrow();
    });
    //!SECTION - STOP BREAKING BEHAVIOUR
});