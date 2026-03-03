import { Light, Object3D } from "three";
import Sfyri3DEntity, { Sfyri3DEntityTypes } from "../types/classes/sfyri3d-entity.class";

/** type guard for light Sfyri3DEntity*/
export function isSfyri3DLightEntity(
    entity: Sfyri3DEntity<Sfyri3DEntityTypes>
): entity is Sfyri3DEntity<Light> {
    return entity.object instanceof Light;
}

/** type guard for object3D Sfyri3DEntity*/
export function isSfyri3DObject3DEntity(
    entity: Sfyri3DEntity<Sfyri3DEntityTypes>
): entity is Sfyri3DEntity<Object3D> {
    return entity.object instanceof Object3D;
}