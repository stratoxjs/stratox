/**
 * Stratox builder
 * Author: Daniel Ronkainen
 * Description:  A modern JavaScript template library that redefines how developers
 *               can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import StratoxItem from './StratoxItem';

export default class StratoxBuilder {
  static factory = {};

  static funcIndex = 0;

  json;

  value = '';

  label = '';

  description = '';

  values = null;

  name = '';

  nameJoin = '';

  nameSplit = [];

  index = 0;

  key;

  fields = {};

  attr = {};

  conAttr = {};

  hasFields = true;

  config = {};

  configList = {};

  settings = {};

  data = {};

  containerInst;

  view;

  #values = {};

  #helper;

  #hasGroupEvents = false;

  constructor(json, key, settings, view, container) {
    this.json = json;
    this.key = key;
    this.settings = settings;
    this.containerInst = container;
    this.view = view;
  }

  /**
   * Create a new component
   * @param {string}   key component name/key
   * @param {callable} fn
   */
  static setComponent(key, fn) {
    if (typeof fn !== 'function') throw new Error('The argument 2 in @setComponent has to be a callable');
    this.factory[key] = fn;
  }

  /**
   * Get template
   * @param  {string} key
   * @return {callable|false}
   */
  getComponent(key) {
    return (StratoxBuilder.factory[key]) ? StratoxBuilder.factory[key] : false;
  }

  /**
   * Check if component exists
   * @param  {string}  key
   * @return {Boolean}
   */
  hasComponent(key) {
    return ((typeof this[key] === 'function') || this.getComponent(key));
  }

  /**
   * Will help you create default field attributes that can be overwritable
   * @param  {object} defArgs add defaults
   * @return {string}
   */
  getAttr(defArgs) {
    let args = defArgs;
    if (typeof args !== 'object') args = {};
    const objFor = Object.assign(args, this.attr);
    return this.getAttrStr(objFor);
  }

  /**
   * Will help you create default field attributes that can be overwritable
   * @param  {object} defArgs add defaults
   * @return {string}
   */
  getAttrStr(attrObj) {
    return Object.entries(attrObj)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('');
  }

  /**
   * This will make it posible for you to build manual forms in your views
   * @param  {string} fieldName
   * @param  {object} args
   * @return {static}
   */
  withField(fieldName, args) {
    const clone = new this.constructor();
    const item = StratoxItem.form(fieldName, args);
    Object.assign(clone, item.get());
    return clone;
  }

  /**
   * Set form values
   * All sets except for value should be a new instance to keep immutability
   * @param object Global values field name (example: {name: "About us", permlink: "about-us"})
   */
  setValues(values) {
    this.#values = values;
    return this;
  }

  /**
   * Is item iterable?
   * @param  array  item array?
   * @return bool
   */
  isIterable(item) {
    if (item === null || item === undefined) return false;
    return (typeof item[Symbol.iterator] === 'function');
  }

  /**
   * Can be used to check if a item in fields "items" is checked/slected
   * @param  {mixed}  value
   * @return {Boolean}
   */
  isChecked(value) {
    if (this.view.isArray(this.value)) {
      return this.value.includes(value);
    }
    return (this.value === value);
  }

  /**
   * Get a unique field ID you could use if you want for whatever (e.g. element ID)
   * @return {string}
   */
  getFieldID() {
    return `wa-fi-${this.key}-${this.index}`;
  }

  /**
   * Check if has grouped events
   * @return {Boolean}
   */
  hasGroupEvents() {
    return this.#hasGroupEvents;
  }

  /**
   * Check if view has extended field views
   * @return {Boolean}
   */
  hasExtendedField() {
    return (typeof this.data.fields === 'object' && this.hasFields === false);
  }

  /**
   * Used to create group fields
   * @param  {Function} callback   Factory
   * @return {string}
   */
  groupFactory(callback, builder) {
    this.#hasGroupEvents = true;

    let out = '';
    let fields = {};
    const inst = this;
    let nk = 0;
    const nj = inst.nameJoin;
    const cloneFields = { ...inst.fields };
    const length = this.getValueLength(1);
    const { config } = this;

    if (!this.view.isArray(this.value)) {
      this.value = Array('');
    }

    if (typeof this.value === 'object') {
      // Using map to create the output and then join it
      out += Object.entries(this.value)
        .map((a, k) => {
          let o = '';
          const btnIndex = inst.index;
          const nestedNames = (config.nestedNames !== undefined && config.nestedNames === true);

          if (config.controls !== undefined && config.controls === true) {
            o += `<div class="group relative card-3 mb-15 rounded border border-primary" data-length="${length}">`;
            if (length > 1) {
              o += `<a class="wa-field-group-delete-btn form-group-icon inline-block pad right-0 top-0 absolute z-10" data-name="${nj}" data-key="${inst.key}" data-index="${btnIndex}" data-position="${k}" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M2 30 L30 2 M30 30 L2 2" /></svg></a>`;
            }
            o += `<a class="wa-field-group-btn form-group-icon before inline-block pad top-0 left-1/2 -translate-x-2/4 -translate-y-2/4 absolute z-10" data-name="${nj}" data-key="${inst.key}" data-index="${btnIndex}" data-position="${k}" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M16 2 L16 30 M2 16 L30 16" /></svg></a>`;
          }

          if (typeof cloneFields === 'object') {
            Object.entries(cloneFields).forEach(([name, arr]) => {
              const fk = (nestedNames) ? `${nj},${nk},${name}` : name;
              fields[fk] = arr;
              o += inst.#html(fields, false);
              fields = {};
            });
          }

          nk++;
          if (config.controls !== undefined && config.controls === true) {
            o += `<a class="wa-field-group-btn form-group-icon after inline-block pad bottom-0 left-1/2 -translate-x-2/4 translate-y-2/4 absolute z-10" data-name="${nj}" data-key="${inst.key}" data-index="${btnIndex}" data-position="${k}" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M16 2 L16 30 M2 16 L30 16" /></a>`;
            o += '</div>';
          }
          return callback(o, a);
        })
        .join('');
    }

    return out;
  }

  /**
   * Build and get all form compontent
   * @return {string}
   */
  getFields() {
    let out = '';
    this.groupFactory((o, val) => {
      out += o;
    });
    return out;
  }

  /**
   * Get a field
   * @param  {string} name The field name
   * @param  {string} type The Expected field type
   * @param  {object} data The field data e.g. label, attributes
   * @return {StratoxItem|string}      Get the field html
   */
  getField(name, type, data) {
    return this.view.getField(name, type, data);
  }

  /**
   * Get field html code
   * @param  {object} values can set values here if you want
   * @return {string}
   */
  get() {
    return this.#html(this.json);
  }

  /**
   * Check and get of validate item exists
   * @param  {string} key
   * @return {object}
   */
  getValidateItem(key) {
    if (this.data && this.data.validate && this.data.validate[key]) {
      return this.data.validate[key];
    }
    return false;
  }

  /**
   * Return and validation, if exists else return false (This method will change)
   * @param  {string} key    validation key
   * @param  {mixed} argKey compare validation argumnet
   * @return {string|bool}
   */
  getValidation(key, argKey) {
    const vl = this.getValidateItem(key);
    return (vl && vl[argKey] !== undefined) ? vl[argKey] : false;
  }

  /**
   * Used mainly to calculate number of custom fields that is grouped
   * @param  {int} minVal change return min number
   * @return {int}
   */
  getValueLength(minVal) {
    let length = 0;
    if (this.value && this.view.isArray(this.value)) length = this.value.length;
    if (typeof minVal === 'number' && length <= minVal) length = minVal;
    return length;
  }

  /**
   * Generate HTML
   * @param  {object} fields
   * @return {string}
   */
  #html(fields, formatData) {
    let build = '';
    if (fields) {
      Object.entries(fields).forEach(([name, data]) => {
        this.data = data;
        this.name = (typeof this.data?.name === 'string') ? this.data.name : name;
        build += this.#build(formatData);
      });
    }
    return build;
  }

  /**
   * Put things together
   * @return {void}
   */
  #build(formatData) {
    // Set some defaults
    this.value = (typeof this.data.value === 'string') ? this.data.value : '';
    this.label = (typeof this.data.label === 'string') ? this.data.label : '';
    this.description = (typeof this.data.description === 'string') ? this.data.description : '';
    this.attr = (typeof this.data.attr === 'object') ? this.data.attr : {};
    this.conAttr = (typeof this.data.conAttr === 'object') ? this.data.conAttr : {};
    this.fields = (typeof this.data.fields === 'object') ? this.data.fields : {};
    this.config = (typeof this.data.config === 'object') ? this.data.config : {};
    this.hasFields = (typeof this.data.hasFields === 'boolean') ? this.data.hasFields : false;

    Object.assign(this.configList, this.config);
    this.#buildFieldNames();
    this.attr['data-name'] = this.nameJoin;

    const val = this.#padFieldValues();
    const fn = this.getComponent(this.data.type);
    let out;
    let formatedData;
    if ((typeof this[this.data.type] === 'function') || fn) {
      const helper = this.#getHelper();
      if (typeof fn === 'function') {
        out = fn.apply(this.view, [(this.data.data ?? {}), this.containerInst, helper, this]);
      } else {
        out = this.#getField(this.data.type);
      }
      this.index++;
      return (out || '');
    }
    this.view.observer().stop();
    console.error(`The component/view named "${this.data.type}" does not exist.`);
    return '';
  }

  /**
   * Get Field
   * @param  {string} fieldType
   * @return {string}
   */
  #getField(fieldType) {
    const helper = this.#getHelper();
    return this[fieldType](helper);
  }

  /**
   * Get helper
   * @return {mixed}
   */
  #getHelper() {
    if (!this.#helper) {
      this.#helper = this.view.getConfig('handlers').helper;
      if (typeof this.#helper === 'function') this.#helper = this.#helper(this);
    }
    return this.#helper;
  }

  /**
   * Will pad empty field values win en empty string value
   * @return {object}
   */
  #padFieldValues() {
    if (this.values) this.#values = this.values;
    const inst = this;
    const hasAVal = false;
    const { nameSplit } = this; const li = (nameSplit.length - 1);
    const last = nameSplit[li];
    let key;
    let valueObj = this.#values;

    if (!valueObj) valueObj = {};

    for (let i = 0; i < li; i++) {
      key = nameSplit[i];
      if (valueObj[key] !== undefined) valueObj = valueObj[key];
    }

    if (valueObj[last] !== undefined) {
      this.value = valueObj[last];
    } else {
      const isNested = Object.entries(this.fields).length;
      if (isNested > 0) {
        valueObj[last] = [{}];
      } else {
        if (typeof valueObj[last] !== 'object') valueObj = {};
        valueObj[last] = '';
        if (!this.value) this.value = '';
      }
    }

    return valueObj;
  }

  /**
   * Build fiels names
   * @return {void}
   */
  #buildFieldNames() {
    this.nameJoin = this.name;
    const nameSplit = this.name.split(',');
    let newName = '';
    this.nameSplit = this.name.split(',');
    if (nameSplit.length > 1) {
      newName = nameSplit.shift();
      for (let i = 0; i < nameSplit.length; i++) {
        newName += `[${nameSplit[i]}]`;
      }
      this.name = newName;
    }
  }

  /**
   * Set default data values
   * @param {object} defaultArg
   */
  setDefault(defaultArg) {
    if (typeof defaultArg !== 'object') {
      throw new Error('The first argument of the Stratox builder "setDefault" must be an object!');
    }
    Object.entries(defaultArg).forEach(([key, row]) => {
      if (!(key in this.data.data)) {
        this.data.data[key] = defaultArg[key];
      }
    });
  }

  /**
   * Check if loading
   * @return {Boolean}
   */
  isLoading() {
    return (this.data?.isLoading === true);
  }

  /**
   * Set loading to true or false
   * @param {Boolean} bool
   */
  setLoading(bool) {
    this.data.isLoading = bool;
  }

  /**
   * Bind a event to a click function
   * @param  {Function} fn event callable
   * @return {string}      string handler
   */
  bind(fn, update) {
    const inst = this;
    const { view } = this;
    const fnName = view.genRandStr(8, 'func_', `_${StratoxBuilder.funcIndex}`);
    const viewName = (typeof update === 'string') ? StratoxItem.getViewName(update) : this.name;

    StratoxBuilder.funcIndex++;
    window[fnName] = (event, name) => {
      event.preventDefault();
      if (update === undefined || update) {
        view.update(name, (data, component) => {
          fn.apply(inst, [event, data, name]);
        });
      } else {
        fn.apply(inst, [event, {}, name]);
      }
    };
    return `${fnName}(event, '${viewName}')`;
  }
}
