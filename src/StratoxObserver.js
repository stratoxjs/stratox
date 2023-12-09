/**
 * Stratox observer
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

export class StratoxObserver {

    #data = {};
    #proxyData = {};
    #callables = [];
    _notified;

    constructor(defaults) {
        if(typeof defaults === "object") this.#data = defaults;
    }
    
    /**
     * Setter
     * @param {object} obj
     * @return {void}
     */
    set(obj) {
        let newobj, inst = this;
        if(typeof obj === "function") {
            newobj = obj(inst.#proxyData);
            Object.assign(inst.#proxyData, newobj);
        } else {
            Object.assign(inst.#proxyData, obj);
        }
    }

    /**
     * Create a factory that will connect to the listener
     * @param  {Function} fn [description]
     * @return {self}
     */
    factory(fn) {
        this.#callables.push(fn);
        return this;
    }

    /**
     * Proxy listener
     * @return {self}
     */
    listener() {
        let inst = this;
        this.#proxyData = new Proxy(this.#data, {
            set: function (target, property, value) {
                target[property] = value;
                inst.notify();
                return true;
            }
        });
        return this;
    }

    /**
     * Notify the listener
     * @return {void}
     */
    notify() {
        let inst = this;
        if(typeof this.#callables === "object") for(const [k, fn] of Object.entries(this.#callables)) {
            fn(inst.#data);
        };
        if(typeof StratoxObserver._notified === "function") {
            StratoxObserver._notified(inst.#data);
        }
    }

    /**
     * Access every notify call globally
     * @param  {callable} call
     * @return {void}
     */
    static notified(call) {
        StratoxObserver._notified = call;
    }

    /**
     * Stop all listeners and unset the proxy
     * @return {void}
     */
    stop() {
        this.#data = {};
        this.#proxyData = {};
        this.#callables = [];
    }
}
