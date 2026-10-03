/**
 * Stratox handlers
 * Author: Daniel Ronkainen
 * Description: Event handlers for inline attributes such as onclick="...". One window function
 *              calls the handler registered under an id, instead of one window function per
 *              handler and render (audit F10). Internal: not exported from index.js.
 * Copyright: Apache License 2.0
 */

const GLOBAL_NAME = 'stratoxHandler';

const handlers = new Map();

const idsByOwner = new WeakMap();

let lastId = 0;

/**
 * The window function that inline attributes call
 * @param  {Event}  event
 * @param  {string} id     The handler id
 * @param  {...mixed} args Passed on to the handler
 * @return {void}
 */
function callHandler(event, id, ...args) {
  const handler = handlers.get(String(id));
  if (typeof handler === 'function') {
    handler(event, ...args);
  }
}

/**
 * Register a handler for an owner (a Stratox instance)
 * @param  {object}   owner
 * @param  {function} fn  Called with the event and any extra arguments from the attribute
 * @return {string}       The call for an inline attribute, e.g. "stratoxHandler(event, '3')"
 */
export function addHandler(owner, fn) {
  if (typeof window !== 'undefined' && typeof window[GLOBAL_NAME] !== 'function') {
    window[GLOBAL_NAME] = callHandler;
  }
  lastId += 1;
  const id = String(lastId);
  handlers.set(id, fn);
  if (!idsByOwner.has(owner)) {
    idsByOwner.set(owner, []);
  }
  idsByOwner.get(owner).push(id);
  return `${GLOBAL_NAME}(event, '${id}')`;
}

/**
 * Remove every handler an owner has registered
 * @param  {object} owner
 * @return {void}
 */
export function clearHandlers(owner) {
  (idsByOwner.get(owner) ?? []).forEach((id) => handlers.delete(id));
  idsByOwner.delete(owner);
}

/**
 * The number of registered handlers, for tests
 * @return {number}
 */
export function countHandlers() {
  return handlers.size;
}
