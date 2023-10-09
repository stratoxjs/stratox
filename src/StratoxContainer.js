/**
 * Stratox Container
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

export class StratoxContainer {

    #service = {};
    static #im;

    /**
     * Immutable container
     * @param  {string}     method call container method
     * @param  {...spread}  args pass args to method
     * @return {mixed}
     */
    static open(method, ...args) {
        if(!this.#im) this.#im = new StratoxContainer();
        if(typeof method === "string") return this.#im[method](...args);
        return this.#im;
    }

    /**
     * Has container/factory
     * @param  {string}  key Uniq identifier
     * @return {Boolean}
     */
    has(key) {
        return (this.#getService(key) !== false);
    }

    /**
     * Check if is container
     * @param  {strong}  key
     * @return {Boolean}
     */
    isContainer(key) {
        return (this.has(key) && !this.isFactory(key));
    }

    /**
     * Check if is factory
     * @param  {strong}  key
     * @return {Boolean}
     */
    isFactory(key) {
        return (typeof this.#getService(key) === "function");
    }

    /**
     * Get a container or factory
     * @param  {string} key     Uniq identifier
     * @param  {argumnets} args pass argumnets to factory
     * @return {mixed}
     */
    get(key, ...args) {
        let service;
        if((service = this.#getService(key))) {
            if(this.isFactory(key)) {
                return service.apply(this, args);
            } else {
                return service;
            }
        } else {
            throw new Error('Tring to get a container ('+key+') that does not exists');
        }
    }

    /**
     * Set a container OR factory
     * @param {string} key      Uniq identifier
     * @param {mixed} value     Whatever you want to share
     * @param {bool} overwrite  Will throw exception if already been defined if not arg is set to TRUE.
     * @return {self}
     */
    set(key, value, overwrite) {
        if(typeof overwrite !== "boolean") overwrite = false;

        let type;

        if(!overwrite && this.has(key)) {
            type = (this.isFactory(key)) ? "factory" : "container";
            throw new Error('The '+type+' ('+key+') already defined. Set argument 3 to true to overwrite, with caution; it may remove key functionalities.');
        }

        this.#service[key] = value;
        return this;
    }

    /**
     * Set a factory ONLY
     * @param {string} key      Uniq identifier
     * @param {mixed} value     Whatever you want to share
     * @param {bool} overwrite  Will throw exception if already been defined if not arg is set to TRUE.
     * @return {self}
     */
    setFactory(key, call, overwrite) {
        if(typeof overwrite !== "boolean") overwrite = false;
        if(!overwrite && this.has(key)) {
            if(!this.isFactory(key)) {
                throw new Error('('+key+') Has already been defined, but has been defined as a container and not factory. If you want to overwrite the container as factory then set overwrite argument to true.');
            } else {
                throw new Error('The factory ('+key+') has already been defined. If you want to overwrite the factory then set overwrite argument to true.');
            }
        }

        this.#service[key] = call;
        return this;
    }

    /**
     * Get service
     * @param  {string} key
     * @return {mixed} False if none
     */
    #getService(key) {
        return (this.#service[key] ?? false);
    }

}