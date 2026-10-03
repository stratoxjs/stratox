/**
 * Stratox observer
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers
 *              can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

export default class StratoxObserver {
  #data = {};

  #isListening = false;

  #callables = [];

  notified;

  // The global hook; kept apart from the static notified() method, so it cannot replace it (audit F2)
  static #hook;

  constructor(defaults) {
    if (typeof defaults === 'object') this.#data = defaults;
  }

  /**
     * Setter
     * @param {object} obj
     * @return {void}
     */
  set(obj) {
    const changes = (typeof obj === 'function') ? obj(this.#data) : obj;
    Object.assign(this.#data, changes);
    // Before listener() the data changes quietly; after it, one set() notifies once (audit F23)
    if (this.#isListening) {
      this.notify();
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
     * Start listening: from now on every set() notifies the factories
     * @return {self}
     */
  listener() {
    this.#isListening = true;
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
    if (typeof StratoxObserver.#hook === 'function') {
      StratoxObserver.#hook(inst.#data);
    }
  }

  /**
     * Access every notify call globally. A new hook replaces the previous one; null removes it.
     * @param  {callable|null} call
     * @return {void}
     */
  static notified(call) {
    StratoxObserver.#hook = (typeof call === 'function') ? call : undefined;
  }

  /**
     * Stop all listeners and unset the proxy
     * @return {void}
     */
  stop() {
    this.#data = {};
    this.#isListening = false;
    this.#callables = [];
  }
}
