import { Light, Object3D } from "three";
import { Sfyri3DEntity } from "../types/classes/sfyri3d-entity.class";

/** type guard for light Sfyri3DEntity*/
export function isSfyri3DLightEntity(
    entity: Sfyri3DEntity
): entity is Sfyri3DEntity {
    return entity.object instanceof Light;
}

/** type guard for object3D Sfyri3DEntity*/
export function isSfyri3DObject3DEntity(
    entity: Sfyri3DEntity
): entity is Sfyri3DEntity {
    return entity.object instanceof Object3D;
}