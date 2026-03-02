import { describe, it, expect, beforeAll, vi } from 'vitest';
import { PerspectiveCamera } from 'three';
import createSfyri3DInstance from '../../index';

describe('CreateSfyri3DInstance', () => {
    let canvas: HTMLCanvasElement;
    let camera: PerspectiveCamera | null;

    beforeAll(() => {
        // crea un canvas fittizio per testare
        canvas = document.createElement('canvas');
        canvas.id = "mock-canvas"
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);

        camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    });

    //SECTION - CORRECT BEHAVIOUR
    it('should create a valid Sfyri3DInstance', () => {
        const instance = createSfyri3DInstance(
            canvas,
            (container) => [new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)]
        );

        //With right input it should be not null
        expect(instance).not.toBe(null);
        //Have at least one camera created with the factory method correctly
        expect(instance.cameras.length).toBeGreaterThan(0);
    });

    it('should create a valid Sfyri3DInstance by searching the canvas from query selector', () => {
        const instance = createSfyri3DInstance(
            "#mock-canvas",
            (container) => [camera!]
        );

        expect(instance).not.toBe(null);
    });
    //!SECTION - CORRECT BEHAVIOUR 

    //SECTION - STOP BREAKING BEHAVIOUR
    it('should throw if no final canvas is passed', () => {
        expect(() => createSfyri3DInstance(
            null as unknown as HTMLCanvasElement,
            () => [camera!]
        )).toThrow();
    });

    it('should throw if query selector does not match any element', () => {
        expect(() => createSfyri3DInstance(
            '#non-existent-canvas',
            () => [camera!]
        )).toThrow();
    });

    it('should throw if camera factory returns empty array', () => {
        expect(() => createSfyri3DInstance(
            canvas,
            () => []
        )).toThrow();
    });
    //!SECTION - STOP BREAKING BEHAVIOUR
});