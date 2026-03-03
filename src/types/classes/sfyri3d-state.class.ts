/**
 * Class used to handle a single entry inside the state of Sfyri3D instance.
 * This class enables to subscribe to a value and get a callback when it changes.
 * The class is written to be "memory friendly" as the portion that handles the callbacks is populated
 * only when there are actual subscriber.
 */
export class Sfyri3DStateEntry<T> {
    //SECTION - PROPS    
    private _key: string;
    public get key() {
        return this._key;
    }

    private _value: T;
    public get value() {
        return this._value;
    }

    private _subscribed: Map<string, () => any> | null = null;
    //!SECTION - PROPS    

    constructor(name: string, value: T) {
        this._key = name;
        this._value = value;
    }

    //SECTION - PUBLIC METHODS
    /**
     * @throws This method can throw error.
     * @param entityName Name of the observer, must be unique in the entry observers list
     * @param callback Method that will be called when the value get updated
     * @param subscriberStateEntrySubscriptions subscription list of the entity, used to trace the subscriptions and unsusbcribe on remove from instance
     * @summary Add an observer record in the list, this observer method will be called when the state value get updated
     */
    public subscribe(entityName: string, callback: () => any, subscriberStateEntrySubscriptions: Set<string>) {
        if (!this._subscribed)
            this._subscribed = new Map();

        if (this._subscribed.has(entityName) || subscriberStateEntrySubscriptions.has(this.key))
            throw new Error(`SFYRI3D - Sfyri3DStateEntry subscribe\nObserver with name ${entityName} already exists, can't add it.`)

        this._subscribed.set(entityName, callback);

        //add this entry as a subscription to the caller
        subscriberStateEntrySubscriptions.add(this.key);
    }

    /**
     * @param entityName Name of the observer to be removed
     * @param subscriberStateEntrySubscriptions subscription list of the entity, we remove this entry in the subscriptions
     * @returns if the entry existes it return true else false
     * @summary Add an observer record in the list, this observer method will be called when the state value get updated
     */
    public unsubscribe(entityName: string, subscriberStateEntrySubscriptions: Set<string>, shouldDeleteEntry: boolean = true) {
        if (this._subscribed) {
            const didDelete = this._subscribed.delete(entityName);

            //remove this entry as a subscription to the ex observer
            if (shouldDeleteEntry)
                subscriberStateEntrySubscriptions.delete(this.key);

            if (this._subscribed.size === 0)
                this._subscribed = null;

            return didDelete;
        }
        return false;
    }

    /**
     * @param value value to update into entry
     * @param shouldSendUpdate decide if should send the update to the observers
     * @summary updates the value of the entry and if shouldSendUpdate is true and at least someone is
     * subscribed it sends the update
     */
    public setValue(value: Partial<T>, shouldSendUpdate: boolean = true) {
        this._value = { ...this._value, ...value };
        if (this._subscribed && this._subscribed.size > 0 && shouldSendUpdate)
            this._subscribed.forEach(s => s());
    }

    /**
     * @summary If shouldSendUpdate at least someone is subscribed it sends the update
     */
    public sendUpdate() {
        if (this._subscribed && this._subscribed.size > 0)
            this._subscribed.forEach(s => s());
    }
    //!SECTION - PUBLIC METHODS
}