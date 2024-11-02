import { StratoxContainer } from './StratoxContainer';

export class StratoxItem {
  compType = '';

  #container;

  type = '';

  label = '';

  description = '';

  name = '';

  attr = {};

  config = {};

  fields = {};

  items = {};

  value = '';

  hasFields = false;

  data = {}; // Merge all values to data

  constructor(type) {
    if (typeof type !== 'string' && typeof type !== 'number') throw new Error(`Argumnent 1: The type/key component name should be a string value and not (${typeof type}).`);
    this.type = type;
  }

  /**
   * Start creating a form item
   * @param  {string} name
   * @param  {object} data
   * @return {self}
   */
  static form(name, data) {
    const inst = new StratoxItem(name);
    inst.compType = 'form';
    inst.setType('text');
    inst.setName(name);
    return inst.merge(data);
  }

  /**
   * Start creating a view item
   * @param  {string} key
   * @param  {object} data
   * @return {self}
   */
  static view(key, data) {
    if (typeof data !== 'object') throw new Error('Argumnent 2 (view object data): In StratoxItem.view is required and should be an object');
    const newKey = StratoxItem.getViewName(key);
    const inst = new StratoxItem(newKey);
    inst.compType = 'view';
    inst.setData(data);
    inst.setName(newKey);
    return inst;
  }

  /**
   * Get form data
   * @param  {string|number} type
   * @param  {object} data
   * @return {object}
   */
  static fromData(type, data) {
    const inst = new StratoxItem(type);
    return inst.merge(data);
  }

  /**
   * Every view name should be created with this
   * @param  {string} name
   * @return {string}
   */
  static getViewName(name) {
    let newName = name;
    if (newName.indexOf('#') < 0) {
      newName += '#defualt';
    }
    return newName;
  }

  /**
   * Get container
   * @param {StratoxContainer} container
   */
  setContainer(container) {
    if (!(container instanceof StratoxContainer)) throw new Error('Must be an intsance of StratoxContainer');
    this.#container = container;
  }

  /**
   * Get field type
   * @return {string}
   */
  getType() {
    return this.type;
  }

  /**
   * Get field name
   * @return {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Get component type (view or form)
   * @return {string}
   */
  getCompType() {
    return this.compType;
  }

  /**
   * Set field label
   * @param {string} str
   */
  setLabel(str) {
    if (typeof str !== 'string' && typeof str !== 'number') throw new Error('Argumnent 1: Is not a string or number');
    this.label = str;
    return this;
  }

  /**
   * Set field descriptiom
   * @param {string} str
   */
  setDescription(str) {
    if (typeof str !== 'string' && typeof str !== 'number') throw new Error('Argumnent 1: Is not a string or number');
    this.description = str;
    return this;
  }

  /**
   * Set field type
   * @param {string} str
   */
  setType(str) {
    if (typeof str !== 'string' && typeof str !== 'number') throw new Error('Argumnent 1: Is not a string or number');
    this.type = str;
    return this;
  }

  /**
   * Set field name
   * @param {string} str
   */
  setName(str) {
    if (typeof str !== 'string' && typeof str !== 'number') throw new Error('Argumnent 1: Is not a string or number');
    this.name = str;
    return this;
  }

  /**
   * Set field attributes
   * @param {object} obj E.g. {title: "lorem"} = title="lorem"
   */
  setAttr(obj) {
    if (typeof obj !== 'object') throw new Error('Argumnent 1: Is not a object');
    this.attr = obj;
    return this;
  }

  /**
   * Set field configs
   * @param {object} obj
   */
  setConfig(obj) {
    if (typeof obj !== 'object') throw new Error('Argumnent 1: Is not a object');
    this.config = obj;
    return this;
  }

  /**
   * Set form multiple field
   * @param {object} obj
   */
  setFields(obj) {
    this.hasFields = true;
    if (typeof obj !== 'object') throw new Error('Argumnent 1: Is not a object');
    const newObj = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value instanceof StratoxItem) {
        newObj[value.getName()] = value.get();
      } else {
        newObj[key] = value;
      }
    });
    this.fields = newObj;
    return this;
  }

  /**
   * Add items to fields (e.g. option, checkboxex, radios)
   * @param {object} obj { value: title }
   */
  setItems(obj) {
    if (typeof obj !== 'object') throw new Error('Argumnent 1: Is not a object');
    this.items = obj;
    return this;
  }

  /**
   * Set the fields value
   * @param {string|number} str
   */
  setValue(str) {
    if (typeof str !== 'string' && typeof str !== 'number') throw new Error('Argumnent 1 is not a string or number');
    this.value = str;
    return this;
  }

  /**
   * Set data will pass on the setted object data to the view
   * @param {object} obj
   */
  setData(obj) {
    if (typeof obj !== 'object') throw new Error('Argumnent 1: Is not a object');
    this.data = obj;
    return this;
  }

  /**
   * Will set appropriate data
   * @param {object} obj
   */
  set(obj) {
    if (this.compType === 'form') {
      if (typeof obj === 'function') {
        obj(this);
      } else {
        Object.assign(this, obj);
      }
    } else if (typeof obj === 'function') {
      obj(this.data);
    } else {
      Object.assign(this.data, obj);
    }
    return this;
  }

  /**
   * WIll return all setted object
   * @return {object}
   */
  getObj() {
    return {
      type: this.type,
      label: this.label,
      description: this.description,
      name: this.name,
      attr: this.attr,
      config: this.config,
      fields: this.fields,
      items: this.items,
      data: this.data,
      hasFields: this.hasFields,
      value: this.value,
    };
  }

  /**
   * Merge object with man StratoxItem objects
   * @param  {object} data
   * @return {self}
   */
  merge(data) {
    Object.assign(this, data);
    return this;
  }

  /**
   * Det object with data
   * @return {object}
   */
  get() {
    const newObj = this.getObj();
    Object.assign(newObj, this.data);
    return newObj;
  }

  /**
   * Get field html output
   * @return {[type]} [description]
   */
  toString() {
    return this.#container.get('view').execute();
  }

  /**
   * Update view (will only execute changes to the view)
   * @param  {string} key  Component name/key
   * @param  {object} data Component data
   * @return {void}
   */
  update(key, data) {
    if (this.#container) {
      let newKey = key;
      let newData = data;
      if (typeof key !== 'string') {
        newKey = this.getName();
        newData = key;
      }
      this.#container.get('view').update(newKey, newData);
    }
  }
}
