import { Light, Object3D } from "three";
import ISfyri3DAsset, { Sfyri3DAssetTypes } from "../types/interfaces/sfyri3d-asset.interface";

/** type guard for light ISfyri3DAsset*/
export function isSfyri3DLightAsset(
    asset: ISfyri3DAsset<Sfyri3DAssetTypes>
): asset is ISfyri3DAsset<Light> {
    return asset.object instanceof Light;
}

/** type guard for object3D ISfyri3DAsset*/
export function isSfyri3DObject3DAsset(
    asset: ISfyri3DAsset<Sfyri3DAssetTypes>
): asset is ISfyri3DAsset<Object3D> {
    return asset.object instanceof Object3D;
}