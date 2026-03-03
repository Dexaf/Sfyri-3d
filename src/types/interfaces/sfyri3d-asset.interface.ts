import { Light, Object3D } from "three";
import Sfyri3DInstance from "../classes/sfyri3d-instance.class";

export type Sfyri3DAssetTypes = Object3D | Light;

export default interface ISfyri3DAsset<Sfyri3DAssetTypes> {
    object: Sfyri3DAssetTypes,
    name: string,
    /** Use an interface to interact with the properites with type checking */
    properties: any,
    /** 
     * Should be used only for animation/transform related stuff, like moving without direct consequences.
     * This allows for stuff like hitboxes to be updated for the logic step.
     * The user inputs will be updated when reaching this method.
     * There is NO order in calling sequence inside this category.
    */
    preRenderingAnimationMethod: ((sfyri3DInstanceRef: Sfyri3DInstance) => void) | null,
    /** 
     * Should be used to handle logic stuff. 
     * The user inputs will be updated when reaching this method.
     * There is NO order in calling sequence inside this category.
     */
    preRenderingLogicMethod: ((sfyri3DInstanceRef: Sfyri3DInstance) => void) | null,
}