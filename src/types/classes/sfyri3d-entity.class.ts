import { Object3D, Light } from "three";
import Sfyri3DInstance from "./sfyri3d-instance.class";

/**
 * Entity used inside the instance to handle pipelines, subscriptions and memory.
 * To add and remove an entity from the istance pass only by the methods, this ensure that
 * everything keeps working.
 */
export class Sfyri3DEntity {
    //SECTION - PROPS
    /** 
     * as it doesn't make much sense to change the enitre object in runtime there is free access to it
     * so there's no protection nor tested consequences.
    */
    public object: Object3D | Light;

    private _name: string;
    public get name() {
        return this._name;
    }

    /**
     *  List of the keys of the entry where this entity is subscribed, used to trace the subscriptions and unsusbcribe 
     *  on remove from instance.
     *  UNLESS YOU HAVE TO CREATE IT THE FIRST TIME YOU USE IT, DON'T TOUCH IT DIRECTLY, SFYRI3D STATE AND THE ISTANCE HANDLES IT.
     */
    public stateEntrySubscriptions: Set<string> | null = null;

    /** Use an interface to interact with the properites with type checking */
    public properties: any;
    //!SECTION - PROPS

    constructor(
        object: Object3D | Light,
        name: string,
        properties: any = null
    ) {
        this.object = object;
        this.object.name = name;
        this._name = name;
        this.properties = properties;
    }

    //SECTION - PUBLIC METHODS 
    /** 
     * Should be used only for animation/transform related stuff, like moving without direct consequences.
     * This allows for stuff like hitboxes to be updated for the logic step.
     * The user inputs will be updated when reaching this method.
     * There is NO order in calling sequence inside this category.
    */
    public preRenderingAnimationMethod: ((sfyri3DInstanceRef: Sfyri3DInstance<any>, deltaTime: number) => void) | null = null;
    /** 
     * Should be used to handle logic stuff. 
     * The user inputs will be updated when reaching this method.
     * There is NO order in calling sequence inside this category.
     */
    public preRenderingLogicMethod: ((sfyri3DInstanceRef: Sfyri3DInstance<any>, deltaTime: number) => void) | null = null;
    //!SECTION - PUBLIC METHODS
}