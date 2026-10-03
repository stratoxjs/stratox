/**
 * Stratox - UI component library
 * Author: Daniel Ronkainen
 * Description:   A modern JavaScript template library that redefines how
 *                developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import StratoxContainer from './StratoxContainer.js';
import StratoxBuilder from './StratoxBuilder.js';
import StratoxObserver from './StratoxObserver.js';
import StratoxItem from './StratoxItem.js';
import { addHandler, clearHandlers } from './StratoxHandlers.js';

export default class Stratox {
  static viewCount = 0;

  static funcIndex = 0;

  static container;

  // The registry key each component function renders from (audit F1)
  static #componentKeys = new WeakMap();

  static #componentKeyCount = 0;

  #field;

  #components = {};

  #observer;

  #imported = {};

  #incremented = [];

  #elem;

  #values = {};

  #creator = {};

  #response;

  #container;

  #ivt;

  #timestamp;

  #prop = false;

  #done;

  #onload;

  #ready = Promise.resolve();

  #blockStates = [];

  #item = {};

  #clones = [];

  /**
   * Default Configs
   * @type {object}
   */
  static #configs = {
    directory: '',
    handlers: {
      fields: null,
      helper: (builder) => {
        // builder
        // GLOBAL container / helper / factory that will be passed on to all views
      },
    },
    cache: false, // Automatically clear cache if is false on dynamic import
    popegation: true, // Automatic DOM popegation protection
  };

  /**
   * Start the Stratox JS instance
   * @param {string|object} elem (#elem, .elem, .elem[data-id="test"], $("#elem"))
   * @return {self}
   */
  constructor(elem) {
    // A selector string, one DOM element or a list of elements (audit F9)
    if (typeof elem === 'string' || (typeof elem === 'object' && elem !== null)) {
      this.#elem = elem;
    }
    this.#values = {};
    // This is the main container that is a singleton
    if (!(Stratox.container instanceof StratoxContainer)) {
      Stratox.container = new StratoxContainer();
    }
    // This is a container instance of Stratox passed to StratoxItem
    this.#container = new StratoxContainer();
    this.#container.set('view', this);
  }

  /**
   * Configurations
   * @param {object} configs
   */
  static setConfigs(configs) {
    // "handlers" is merged one level deep, so { handlers: { fields } } keeps the default helper (audit F12)
    const { handlers, ...rest } = configs;
    Object.assign(this.#configs, rest);
    if (typeof handlers === 'object' && handlers !== null) {
      this.#configs.handlers = { ...this.#configs.handlers, ...handlers };
    }
  }

  /**
   * Get config from configurations
   * @param  {string|empty} key
   * @return {mixed}
   */
  static getConfigs(key) {
    return (typeof key === 'string') ? Stratox.#configs[key] : Stratox.#configs;
  }

  /**
   * Get form handler
   * @return {StratoxBuilder} instance of StratoxBuilder
   */
  static getFormHandler() {
    const handler = Stratox.getConfigs('handlers').fields;
    if (handler === null || handler === undefined) {
      return StratoxBuilder;
    }
    if (typeof handler?.setComponent !== 'function') {
      throw new Error('The form handler needs to be extending to the class StratoxBuilder!');
    }
    return handler;
  }

  /**
   * You can pre import or statically prepare view with this method
   * @param  {string}   key View name/key
   * @param  {Function} fn
   * @return {void}
   */
  static setComponent(key, fn) {
    const handler = Stratox.getFormHandler();
    handler.setComponent(key, fn, this);
  }

  /**
   * Set component with instance
   * @param  {string}   key
   * @param  {Function} fn
   * @return {void}
   */
  withComponent(key, fn) {
    this.constructor.setComponent(key, fn);
  }

  /**
   * withObserver Immutable
   * used to either create a new instance or access global callbacks
   * Observer has a Global notify callback listener that will be triggered
   * every time observer is updated
   * @return {StratoxObserver}
   */
  static withObserver() {
    return StratoxObserver;
  }

  /**
   * Observer
   * @return {StratoxObserver}
   */
  observer() {
    return this.#observer;
  }

  /**
   * Get a config
   * Instance based, and passed on to the builder
   * @param  {string} key
   * @return {mixed}
   */
  getConfig(key) {
    return this.constructor.getConfigs(key);
  }

  /**
   * You can set element later.
   * E.g. If you set it in your template view then it will start to auto-update on observer change!
   * @param {string|object} elem (#elem, .elem, .elem[data-id="test"], $("#elem"))
   */
  setElement(elem) {
    this.#elem = elem;
  }

  /**
   * You can pass objects, instances, and factories to your views
   * Re-name it to getContainer?
   * @return {StratoxContainer}
   */
  container() {
    return Stratox.container;
  }

  /**
   * Open new Stratox instance
   * @param  {string} elem String element query selector
   * @return {Stratox}
   */
  clone(elem) {
    const view = new Stratox(elem);
    // Partials and blocks are clones made during a render; their handlers go with this view's (audit F10)
    this.#clones.push(view);
    return view;
  }

  /**
   * Remove the event handlers of the last render, also those of its partials and blocks (audit F10)
   * @return {void}
   */
  #clearHandlers() {
    clearHandlers(this);
    this.#clones.forEach((view) => view.#clearHandlers());
    this.#clones = [];
  }

  /**
   * Attach a view to specified element string
   * @example this.attachViewToEl("#table", table, data.table)
   * @param  {string} el   Element has string
   * @param  {function} view Expected view function
   * @param  {object} data Data passed to view
   * @return {self}
   */
  attachViewToEl(el, view, data, call, before) {
    const clone = this.clone();
    const item = clone.view(view, data);
    clone.setElement(el);

    if (typeof before === 'function') {
      before.apply(clone, [clone, item, el]);
    }

    // Ready should not be called outside of stratox class!
    const func = () => {
      clone.execute();
      if (typeof call === 'function') {
        call.apply(clone, [clone, item, el]);
      }
    };

    this.#blockStates.push(func);
    return clone;
  }

  /**
   * Easily create a view
   * @param see "viewEngine" method
   */
  view(...args) {
    return this.viewEngine(...args);
  }

  /**
   * The view engine
   * Should ONLY be used in view method and extending classes
   * @param  {string|function|object} key
   * @param  {object|StratoxFetch} data
   * @return {StratoxItem}
   */
  viewEngine(key, data) {
    let viewKey = key;
    let componentKey;

    if (typeof key === 'function' || typeof key === 'object') {
      const comp = this.#getSetCompFromKey(key);
      Stratox.setComponent(comp.name, comp.func);
      viewKey = comp.name;
      componentKey = Stratox.#componentKey(StratoxItem.getViewName(comp.name), comp.func);
    }
    // A view shown again merges into the rendered view's data; update() then renders it (audit F7)
    const newObj = this.#components[StratoxItem.getViewName(viewKey)]?.data || {};
    Object.assign(newObj, data);
    this.#creator[viewKey] = this.#initItemView(viewKey, newObj);
    if (componentKey) {
      // The item keeps its view name for update(); its type says which function renders it
      this.#creator[viewKey].setType(componentKey);
    }
    this.#item = this.#creator[viewKey];
    return this.#item;
  }

  /**
   * The registry key a component function renders from. Normally its view name ("Card#defualt").
   * A different function with the same name, or another anonymous function, gets its own key
   * ("Card#defualt~1"), so it renders itself instead of the first one (audit F1).
   * @param  {string}   viewName
   * @param  {function} func
   * @return {string}
   */
  static #componentKey(viewName, func) {
    let key = Stratox.#componentKeys.get(func);
    if (!key) {
      const { factory } = Stratox.getFormHandler();
      key = viewName;
      if (factory[key] && factory[key] !== func) {
        Stratox.#componentKeyCount += 1;
        key = `${viewName}~${Stratox.#componentKeyCount}`;
      }
      Stratox.#componentKeys.set(func, key);
      Stratox.setComponent(key, func);
    }
    return key;
  }

  /**
   * Create a partial to the view meaning it is not self contained
   * but rather a part of the view making it a static component but has better performance
   * @param see "partialEngine" method
   */
  partial(key, data, call) {
    return this.partialEngine(key, data, call);
  }

  /**
   * The partial view engine
   * Should ONLY be used in view method and extending classes
   * @param  {string|object|function} key  View key/name, use it as a string or {viewName: "#element"}.
   * @param  {object} data The view data
   * @param  {callable|object} call
   * @return {object|string}
   */
  partialEngine(key, data, call) {
    const view = this.clone();
    const item = view.view(key, data);
    if (typeof call?.modify === 'function') {
      call.modify.apply(view, [item]);
    }
    const output = view.execute(typeof call?.response === 'function' ? call.response : call);
    return {
      output,
      view,
      item,
      toString() {
        return output;
      },
    };
  }

  /**
   * Create a self contained block
   * This is a special method that need exta implementation to work!
   * @param  {string|object|function} view  View key/name, use it as a string or {viewName: "#element"}.
   * @param  {object|StratoxFetch} data
   * @param  {object} config
   * @return {string}
   */
  block(view, data, config) {
    const elID = this.getID(this.genRandStr(6));
    const doneCall = (typeof config === 'function') ? config : config?.response;
    const output = `<div id="${elID}"></div>`;
    const inst = this.attachViewToEl(`#${elID}`, view, data, (instArg, item, el) => {
      if (typeof doneCall === 'function') {
        doneCall(item.data, instArg, item, el);
      }
    }, config?.modify);

    return {
      output,
      view: inst,
      toString() {
        return output;
      },
    };
  }

  getItem() {
    return this.#item;
  }

  /**
   * Easily create and get multiple fields
   * @param {string} name  Field name
   * @param {object} data  The form data
   * @return {StratoxItem} (will return an instance of StratoxItem)
   */
  form(name, data) {
    const newObj = (this.#components[name]) ? this.#components[name] : {};
    Object.assign(newObj, data);
    this.#creator[name] = StratoxItem.form(name, data);
    this.#creator[name].setContainer(this.#container);
    return this.#creator[name];
  }

  /**
   * Get a field
   * @param  {string} name The field name
   * @param  {string} type The Expected field type
   * @param  {object} data The field data e.g. label, attributes
   * @return {StratoxItem|string}
   */
  getField(name, type, data) {
    let newData = data;
    if (typeof data !== 'object') {
      newData = {};
    }
    newData.type = type;
    return this.clone().form(name, newData);
  }

  /**
   * Form and component are the same, but below while the usage of the
   * form is used in the context in a unit, component is not.
   * @param  {string} name The component name
   * @param  {object} data Pass data to the component (Not required)
   * @return {StratoxItem}
   */
  getComponent(name, data) {
    const inst = this.open();
    return inst.form(name, data);
  }

  /**
   * Get component object in its purest form
   * @return {object}
   */
  read() {
    return this.#components;
  }

  /**
   * Update view (will only execute changes to the view)
   * @param  {string|StratoxItem} key  Component name/key
   * @param  {object|callable} data Component data
   * @return {void}
   */
  update(key, data) {
    if (typeof key === 'function') {
      return this.updateAll(key);
    }
    if (key === undefined) {
      this.#observer?.notify();
      return this;
    }
    if (key instanceof StratoxItem) {
      this.#components[key.getName()] = key;
    } else {
      const component = this.#findComponent(key);
      if (typeof data === 'function') {
        data(component?.data, component);
      } else {
        Object.assign(component.data, data);
      }
    }
    // Before execute() there is nothing to render yet; execute() renders the changed data (audit F8)
    this.#observer?.set(this.#components);
    return this;
  }

  /**
   * Find a view or form item by the name given to update(). A view is stored as "Card#defualt",
   * a form item under its bare name (audit F32); a view wins when both exist.
   * Before execute() the items are only in the creator list (audit F8).
   * @param  {string} name  e.g. "Card", "Card#defualt" or a form field name
   * @return {StratoxItem|object|undefined}
   */
  #findComponent(name) {
    const viewKey = StratoxItem.getViewName(name);
    const found = this.#components[viewKey] ?? this.#components[name];
    if (found) {
      return found;
    }
    const creatorItems = Object.values(this.#creator);
    return creatorItems.find((item) => item.getName() === viewKey)
      ?? creatorItems.find((item) => item.getName() === name);
  }

  /**
   * Will update all views in instance
   * @param  {callable} fn
   * @return {self}
   */
  updateAll(fn, update) {
    // Before execute() the views are only in the creator list (audit F8)
    const components = this.#observer ? this.#components : this.#creator;
    Object.entries(components).forEach(([name, row]) => {
      fn(row?.data, row);
    });
    if (update !== false) {
      this.#observer?.set(this.#components);
    }
    return this;
  }

  /**
   * Bind a event to a click function
   * @param  {Function} fn event callable
   * @return {string}      string handler
   */
  bind(fn, update) {
    const inst = this;
    Stratox.funcIndex++;
    // One window function for all handlers; this view's handlers are replaced on each render (audit F10)
    return addHandler(this, (event) => {
      event.preventDefault();
      inst.updateAll((data, item) => {
        fn.apply(inst, [data, inst, item, event]);
      }, (update !== false));
    });
  }

  /**
   * Has view loaded?
   * @return {Boolean}
   */
  hasView() {
    return (typeof this.#response === 'string');
  }

  /**
   * Get a somewhat unique identifier
   * @param  {string} prefix Add a prefix to view count
   * @return {string}
   */
  getID(prefix) {
    let newPrefix = prefix;
    if (typeof prefix !== 'string') {
      newPrefix = 'el';
    }
    return `stratox-${newPrefix}-${this.getViewCount()}`;
  }

  /**
   * Get a unique elemnt string name
   * @param  {string} prefix
   * @return {string}
   */
  getUniqueElem(prefix) {
    let newPrefix = prefix;
    if (typeof prefix !== 'string') {
      newPrefix = 'el';
    }
    return this.getID(`${this.genRandStr(8)}-${newPrefix}`);
  }

  /**
   * Get a random string
   * @param  {int} length
   * @return {string}
   */
  genRandStr(length, pad, pad2) {
    let p1 = pad;
    let p2 = pad2;
    if (typeof pad !== 'string') {
      p1 = '';
    }
    if (typeof pad2 !== 'string') {
      p2 = '';
    }
    return p1 + Math.random().toString(36).substring(2, 2 + length) + p2;
  }

  /**
   * Get view response
   * @return {string}
   */
  getResponse() {
    return (this.#response ?? '');
  }

  /**
   * Trigger callback when script is ready
   * @param  {Function} fn
   * @param  {number} time
   * @return {void}
   */
  eventOnload(fn, time = 0) {
    setTimeout(fn, time);
  }

  /**
   * Set form values
   * @param {object} values
   */
  setValues(values) {
    if (typeof values !== 'object') throw new Error('The argument 1 has to be an object');
    this.#values = values;
  }

  /**
   * Get the form values: the object given to setValues(), kept up to date while the user
   * types and adds or removes group rows (V-9). It is the same object, not a copy.
   * @return {object}
   */
  getValues() {
    return this.#values;
  }

  /**
   * Advanced option to add view and form data
   * @param {mixed} key  The view key/name or object form StratoxItem instance
   * @param {object} data Pass data to view
   */
  add(key, data) {
    if (key instanceof StratoxItem) {
      this.#components[key.getName()] = key;
    } else {
      this.#components[key] = data;
    }
    return this;
  }

  /**
   * Get DOM element
   * @return {StratoxDom}
   */
  getElement() {
    // A selector and a single element both become a list, so html() can loop over it (audit F39)
    const isList = typeof this.#elem?.forEach === 'function';
    if (typeof this.#elem === 'string' || (this.#elem && !isList)) {
      this.#elem = this.setSelector(this.#elem);
    }
    return this.#elem;
  }

  /**
   * Get current view count
   * @return {number}
   */
  getViewCount() {
    return Stratox.viewCount;
  }

  /**
   * Build the response
   * @param  {callable} call
   * @return {void}
   */
  async build(call) {
    const inst = this;
    let dir = '';
    const Handler = Stratox.getFormHandler();

    this.#field = new Handler(this.#components, 'view', Stratox.getConfigs(), inst, Stratox.container);

    // Values are used to trigger magic methods
    this.#field.setValues(this.#values);

    dir = Stratox.getConfigs('directory');
    if (!dir.endsWith('/')) dir += '/';

    // Each component may load a module; collect them, so build() settles once all have rendered (V-2)
    const loading = Object.entries(this.#components).map(async ([key, data]) => {
      if (inst.#field.hasComponent(data.type)) {
        // Component is loaded...
      } else if (data.compType !== 'form') {
        const extractFileName = key.split('#');
        const file = extractFileName[0];
        const compo = inst.#field.hasComponent(file);
        
        inst.#incremented.push(false);

        if (typeof compo === 'function') {
          Handler.setComponent(key, compo);
          inst.#incremented[inst.#incremented.length - 1] = true;
        } else {
          const module = await import(/* @vite-ignore */ `${dir}${file}.js${inst.#cacheParam()}`);
          Object.entries(module).forEach((fn) => {
            Handler.setComponent(key, fn);
          });
          call(inst.#field);
        }
        inst.#imported[file] = true;
      } else {
        console.warn(`To use the field item ${data.type} you need to specify a formHandler in config!`);
      }
    });
    
    if (typeof call === 'function'
    && (inst.#incremented[inst.#incremented.length - 1]
    || (inst.#incremented.length === 0 && inst.#field))) {
      call(inst.#field);
    }
    await Promise.all(loading);
  
  }

  /**
   * Build, process and execute to DOM
   * @param  {callable} call
   * @return {void}
   */
  execute(call) {
    const inst = this;
    let wait = true;
    // Already created then update view
    if (typeof this.#observer === 'object') {
      this.#observer.notify();
      return this.getResponse();
    }

    // Start build and create views
    this.#prepareViews();
    this.#observer = new StratoxObserver(this.#components);
    this.#ready = inst.build((field) => {
      let propCheck = {};
      let ivtPropCheck;
      inst.#observer.factory((jsonData, temp) => {
        if (!propCheck?.[field.name]) {
          Stratox.viewCount++;
          // If response is not empty,
          // then insert, processed components and insert to the document
          inst.#clearHandlers();
          inst.#response = field.get();
          propCheck[field.name] = true;

          if (inst.#elem && (typeof inst.#response === 'string') && inst.#response) {
            inst.insertHtml();
          }
          // Trigger done on update
          if (typeof inst.#done === 'function' && !wait) {
            inst.#done.apply(inst, [field, inst.#observer, 'update']);
          }

          if (inst.#blockStates.length > 0 && !wait) {
            inst.#loadBlockStates(field);
          }
          wait = false;

          // Will make sure each unique view is not spammed
          propCheck = {};
        }
      });

      // Init listener and notify the listener
      inst.#observer.listener().notify();
      inst.#prop = false;

      // Callback
      if (typeof call === 'function') {
        call.apply(inst, [inst.#observer]);
      }
      if (field.hasGroupEvents()) {
        if (!inst.startFormEvents(field)) {
          inst.bindGroupEvents('body');
        }
      }

      // Trigger done on load
      inst.eventOnload(() => {
        if (typeof inst.#done === 'function' && !wait) inst.#done.apply(inst, [field, inst.#observer, 'load']);
        if (typeof inst.#onload === 'function') inst.#onload.apply(inst, [field, inst.#observer]);
        inst.#loadBlockStates(field);
      });
    });
    return this.getResponse();
  }

  /**
   * Wait for the last execute(): resolves when every component, also the ones loaded from
   * the "directory" config, has rendered; rejects with the first error (V-2, audit F3).
   * Before the first execute() it is already resolved.
   * @return {Promise<void>}
   */
  ready() {
    return this.#ready.then(() => undefined);
  }

  onload(fn) {
    this.#onload = fn;
  }

  done(fn) {
    this.#done = fn;
  }

  /**
   * Start form events. This should either be called in execute callable or inside a view template
   * @param  {StratoxBuilder} field   An instance of StratoxBuilder
   * @return {void}
   */
  startFormEvents(field) {
    const inst = this;
    if (field.hasGroupEvents() && inst.#elem) {
      inst.bindGroupEvents(inst.#elem);
      return true;
    }
    return false;
  }

  /**
   * Bind grouped event to DOM
   * @param  {string} elem Element string query selector
   * @return {void}
   */
  bindGroupEvents(elem) {
    const inst = this;
    this.onload(() => {
      inst.bindEvent(elem, 'input', (e, target) => {
        const key = target.dataset.name;
        const type = target.getAttribute('type');
        let value = (target.value ?? '');
        if (type === 'checkbox' && target.name.endsWith('[]')) {
          // A checkbox with several items keeps an array of its checked values (audit F40)
          const boxes = [...e.currentTarget.querySelectorAll('input[type="checkbox"]')];
          value = boxes.filter((box) => box.dataset.name === key && box.checked).map((box) => box.value);
        } else if (type === 'checkbox' || type === 'radio') {
          value = target.checked ? value : 0;
        }
        inst.editFieldValue(key, value);
      });

      inst.bindEvent(elem, 'click', '.wa-field-group-btn', (e, target) => {
        e.preventDefault();
        const key = target.dataset.name;
        const pos = parseInt(target.dataset.position, 10);
        inst.addGroupField(key, pos, target.classList.contains('after'));
      });

      inst.bindEvent(elem, 'click', '.wa-field-group-delete-btn', (e, target) => {
        e.preventDefault();
        const key = target.dataset.name;
        const pos = parseInt(target.dataset.position, 10);
        inst.deleteGroupField(key, pos);
      });
    });
  }

  /**
   * Prepare all views from data
   * @return {void}
   */
  #prepareViews() {
    const inst = this;
    if (Object.keys(this.#creator).length > 0) {
      Object.entries(this.#creator).forEach(([k, v]) => {
        // An item passed to a group's setFields renders inside the group only (audit F37)
        if (!v.inGroup) inst.add(v);
      });
    }
  }

  /**
   * This will load all block states when they are ready
   * @param  {object} field
   * @return {void}
   */
  #loadBlockStates(field) {
    let i;
    const inst = this;
    if (inst.#blockStates.length > 0) {
      for (i = 0; i < inst.#blockStates.length; i++) {
        inst.#blockStates[i].apply(inst, [field, inst.#observer]);
      }
    }
    inst.#blockStates = [];
  }

  /**
   * Traverse the values from jointName
   * @param  {object}   obj
   * @param  {Array}   keys
   * @param  {Function} fn   Used to make changes to value
   * @return {void}
   */
  modifyValue(obj, keys, fn) {
    let currentObj = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (currentObj[key] === undefined || typeof currentObj[key] !== 'object') {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    const lastKey = keys[keys.length - 1];
    fn(currentObj, lastKey);
  }

  /**
   * Create a grouped field
   * @param {string} key
   * @param {int} pos
   * @param {boolean} after (before (false) / after (true))
   */
  addGroupField(key, pos, after) {
    const inst = this;
    const nameArr = key.split(',');
    const values = this.#values;
    let position = pos;

    if (after) position += 1;
    this.modifyValue(values, nameArr, (obj, keyB) => {
      const newObj = obj;
      if (!inst.isArray(newObj[keyB])) newObj[keyB] = Object.values(newObj[keyB]);
      newObj[keyB].splice(position, 0, {});
    });

    this.#observer.notify();
    return values;
  }

  /**
   * Delete a grouped field
   * @param  {string} key
   * @param  {int} pos
   * @return {object}
   */
  deleteGroupField(key, pos) {
    const nameArr = key.split(',');
    const values = this.#values;

    this.modifyValue(values, nameArr, (obj, keyB) => {
      const newObj = obj;
      if (newObj[keyB].length > 1) {
        newObj[keyB].splice(pos, 1);
      }
    });

    this.#observer.notify();
    return values;
  }

  /**
   * Will save the value changes to field value object
   * @param  {string} key
   * @param  {object} value
   * @return {object}
   */
  editFieldValue(key, value) {
    const nameArr = Array.isArray(key) ? key : key.split(',');
    this.modifyValue(this.#values, nameArr, (obj, keyB) => {
      const newObj = obj;
      newObj[keyB] = value;
    });
    return this.#values;
  }

  /**
   * Insert HTML, will protect you from unintended DOM Propagation and
   * keep High performance even though DOM would be stuck in a 100000 loop!
   * @return {void}
   */
  insertHtml() {
    const inst = this;
    if (Stratox.#isPropagationProtected() === false || !inst.#prop) {
      inst.#prop = true;
      inst.html(inst.#response);
    } else {
      // DOM Propagation protection
      // Will be triggered if same DOM el is trigger consequently
      if (inst.#ivt !== undefined) clearTimeout(inst.#ivt);
      inst.#ivt = setTimeout(() => {
        inst.#prop = false;
        inst.html(inst.#response);
      }, 0);
    }
  }

  /**
   * Is DOM propagation protection on? Reads the config key "propagation", and the
   * misspelled "popegation" that older code uses. When both are set, "propagation" wins.
   * @return {boolean}
   */
  static #isPropagationProtected() {
    return Stratox.getConfigs('propagation') ?? Stratox.getConfigs('popegation');
  }

  /**
   * Set selector/element
   * @param {object}
   */
  setSelector(elem) {
    if (typeof document === 'object') {
      if (typeof elem === 'object') {
        return [elem];
      }
      if (elem.indexOf('#') === 0) {
        return [document.getElementById(elem.substring(1))];
      }
      return document.querySelectorAll(elem);
    }
    return null;
  }

  /**
   * Insert HTML into main rect
   * @param  {string} out
   * @return {void}
   */
  html(out) {
    const myElem = this.getElement();
    if (myElem) {
      myElem.forEach((elem) => {
        const el = elem;
        if (el) el.innerHTML = out;
      });
    }
  }

  /**
   * Easy to work with event handler
   * @param  {array|spread} argument
   * @return {void}
   */
  bindEvent(...args) {
    const [selector, event, elem, call] = args;
    const elements = typeof selector === 'string' ? this.setSelector(selector) : selector;
    const callback = typeof elem === 'function' ? elem : call;
    const target = typeof elem === 'string' ? elem : null;

    elements.forEach((item) => {
      if (item) {
        const el = item;
        const eventHandler = (e) => {
          let targetElem = e.target;
          if (target) targetElem = e.target.closest(target);
          if (targetElem) callback.apply(targetElem, [e, targetElem]);
        };
        el.addEventListener(event, eventHandler);
        // off() removes every listener bindEvent added to the element, not only the last (audit F41)
        const previousOff = el.off;
        el.off = () => {
          el.removeEventListener(event, eventHandler);
          if (typeof previousOff === 'function') previousOff();
        };
      }
    });
  }

  /**
   * Check if is array
   * @param  {mixed}  item
   * @return {bool}
   */
  isArray(item) {
    return Array.isArray(item);
  }

  /**
   * Will pass on container
   * @param  {string} key
   * @param  {object} obj
   * @return {StratoxItem}
   */
  #initItemView(key, obj) {
    const inst = StratoxItem.view(key, obj);
    inst.setContainer(this.#container);
    return inst;
  }

  /**
   * Get timestamp (Can be used to auto clear cache)
   * @return {int}
   */
  #getTime() {
    if (!this.#timestamp) {
      this.#timestamp = new Date().getTime();
    }
    return this.#timestamp;
  }

  /**
   * Get cache parameter
   * @return {string}
   */
  #cacheParam() {
    return Stratox.getConfigs('cache') === false ? `?v=${this.#getTime()}` : '';
  }

  /**
   * Return possible component setter
   * @param  {function|object} key
   * @return {object}
   */
  #getSetCompFromKey(key) {
    if (typeof key === 'object') {
      const keys = Object.keys(key);
      const func = key[keys[0]];
      return { name: `${func.name}#${keys[0]}`, func };
    }
    return { name: key.name, func: key };
  }

  /**
   * Has been deprecated and removed
   */
  static create(key, data, args) {
    console.error("The static create function was removed from the Stratox library in version 3.");
    return this;
  }
}
