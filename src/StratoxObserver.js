/**
 * Stratox observer
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers
 *              can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

export default class StratoxObserver {
  #data = {};

  #proxyData = {};

  #callables = [];

  notified;

  constructor(defaults) {
    if (typeof defaults === 'object') this.#data = defaults;
  }

  /**
     * Setter
     * @param {object} obj
     * @return {void}
     */
  set(obj) {
    let newobj; const
      inst = this;
    if (typeof obj === 'function') {
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
    const inst = this;
    this.#proxyData = new Proxy(this.#data, {
      set: (target, property, value) => {
        const newTarget = target;
        newTarget[property] = value;
        inst.notify();
        return true;
      },
    });
    return this;
  }

  /**
     * Notify the listener
     * @return {void}
     */
  notify() {
    const inst = this;
    if (typeof this.#callables === 'object') {
      this.#callables.forEach((fn) => {
        fn(inst.#data);
      });
    }
    if (typeof StratoxObserver.notified === 'function') {
      StratoxObserver.notified(inst.#data);
    }
  }

  /**
     * Access every notify call globally
     * @param  {callable} call
     * @return {void}
     */
  static notified(call) {
    StratoxObserver.notified = call;
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
