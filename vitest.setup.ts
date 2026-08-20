import { vi, vitest } from 'vitest';

//NOTE: web gl context doesn't exists in test env, we mock it
vi.mock('three', async () => {
    const actual = await vi.importActual<typeof import('three')>('three');

    const canvas = document.createElement('canvas');
    //needed for tests where timer disconnect from ownerdocument
    const parent = document.createElement('html');
    parent.appendChild(canvas);

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        font: '',
        fillStyle: '',
        strokeStyle: '',
        textAlign: 'start',
        textBaseline: 'alphabetic',

        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({
            width: 0,
        })),

        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    
    return {
        ...actual,
        WebGLRenderer: class {
            render() { };
            dispose() { };
            forceContextLoss() { };
            domElement = canvas;
            setSize(width: number, height: number) { this.domElement.width = width; this.domElement.height = height; }
        }
    };
});