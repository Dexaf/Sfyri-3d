import { vi } from 'vitest';

//NOTE: web gl context doesn't exists in test env, we mock it
vi.mock('three', async () => {
    const actual = await vi.importActual<typeof import('three')>('three');

    const canvas = document.createElement('canvas');
    //needed for tests where timer disconnect from ownerdocument
    const parent = document.createElement('html');
    parent.appendChild(canvas);

    return {
        ...actual,
        WebGLRenderer: class {
            render() { };
            dispose() { };
            forceContextLoss() { };
            domElement = canvas;
            setSize(width: number, height: number) { this.domElement.width = width; this.domElement.height = height; }
        },
    };
});