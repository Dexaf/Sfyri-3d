import { Light, Object3D } from "three";

export type Sfyri3DAssetTypes = Object3D | Light;

export default interface ISfyri3DAsset<Sfyri3DAssetTypes> {
    object: Sfyri3DAssetTypes,
    name: string,
    /** Use an interface to interact with the properites with type checking */
    properties: any
}