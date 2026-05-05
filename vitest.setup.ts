import { vi } from 'vitest';

//NOTE: web gl context doesn't exists in test env, we mock it
vi.mock('three', async () => {
    const actual = await vi.importActual<typeof import('three')>('three');
    return {
        ...actual,
        WebGLRenderer: class {
            render() { };
            dispose() { };
            forceContextLoss() { };
            domElement = document.createElement('canvas');
            setSize(width: number, height: number) { this.domElement.width = width; this.domElement.height = height; }
        },
    };
});