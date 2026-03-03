import { Sfyri3DStateEntry } from "../types/classes/sfyri3d-state.class";

interface ISfyri3DState {
    [key: string]: Sfyri3DStateEntry<any>;
}
/**Assertion that an object is a valid state for the istance */
export function assertSfyri3DState(obj: any): asserts obj is ISfyri3DState {
    if (obj) {
        if (typeof obj !== 'object') {
            throw new Error(
                `SFYRI3D - Sfyri3DInstance Constructor\n` +
                `No valid state object was passed to the instance you wanted to create.`
            );
        }

        for (const key of Object.keys(obj)) {
            if (!(obj[key] instanceof Sfyri3DStateEntry)) {
                throw new Error(
                    `SFYRI3D - Sfyri3DInstance Constructor\n` +
                    `Value for key "${key}" is not a valid Sfyri3DStateEntry.`
                );
            }
        }
    }
}