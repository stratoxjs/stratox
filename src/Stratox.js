/**
 * Stratox
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import { StratoxContainer } from './StratoxContainer.js';
import { StratoxBuilder } from './StratoxBuilder.js';
import { StratoxObserver } from './StratoxObserver.js';
import { StratoxItem } from './StratoxItem.js';

export class Stratox {

    static viewCount = 0;

    #bindKey;
    #field;
    #components = {};
    #observer = {};
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

    /**
     * Default Configs
     * @type {object}
     */
    static #configs = {
        directory: "",
        handlers: {
            fields: null,
            helper: function(builder) {
                // GLOBAL container / helper / factory that will be passed on to all views  
            }
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
        if(typeof elem === "string") {
            this.#elem = this.setSelector(elem);
        }
        this.#values = {};
        this.#container = new StratoxContainer();
        this.#container.set("view", this);
    }

    /**
     * Configurations
     * @param {object}
     */
    static setConfigs(configs) {
        Object.assign(this.#configs, configs);
    }

    /**
     * Get config from configurations
     * @param  {string|empty} key
     * @return {mixed}
     */
    static getConfigs(key) {
        return (typeof key === "string") ? Stratox.#configs[key] : Stratox.#configs;
    }

    /**
     * Get form handeler
     * @return {StratoxBuilder} instance of StratoxBuilder
     */
    static getFormHandler() {
        const handler = Stratox.getConfigs("handlers").fields;
        if(handler === null || handler === undefined) {
            return StratoxBuilder;
        }
        if(typeof handler?.setComponent !== "function") {
            throw new Error("The form handler needs to be extending to the class StratoxBuilder!");
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
        if(typeof fn !== "function") throw new Error("The argument 2 in @prepareView has to be a callable");
        const handler = Stratox.getFormHandler();
        handler.setComponent(key, fn, this);
    }

    // DEPRECATED (Renamed to setComponent)
    static prepareView(key, fn) {
        Stratox.setComponent(key, fn);
    }

    /**
     * Create a immutable view (self contained instance, for e.g. modals)
     * @param  {string|object} key  View key/name, either use it as a string or { viewName: "#element" }.
     * @param  {object} data        The view data
     * @param  {fn} call            callback
     * @return {StratoxItem}
     */
    static create(key, data, call) {
        const obj = this.#getIdentifiers(key), 
        inst = new Stratox(obj.elem);
        let item = inst.view(obj.name, data);
        item.setContainer(inst.#container);
        inst.execute(call);
        return inst;
    }

    /**
     * withObserver Immutable
     * used to either create a new instance or access global callbacks
     * Oberver has a Global notify callback listner that will be triggered
     * every time observer is updated
     * @return {StratoxObserver}
     */
    static withObserver() {
        return StratoxObserver;
    }

    /**
     * Get a config
     * Instance based, and passed on to the builder
     * @param  {string} key
     * @return {mixed}
     */
    _getConfig(key) {
        return Stratox.getConfigs(key);
    }

    /**
     * You can set element later. 
     * E.g. If you set it in your template view then it will start to auto update on observer change!
     * @param {string|object} elem (#elem, .elem, .elem[data-id="test"], $("#elem"))
     */
    setElement(elem) {
        this.#elem = this.setSelector(elem);
    }

    /**
     * You can pass objects, instances and factories to you views
     * @return {StratoxContainer}
     */
    container() {
        return this.#container;
    }

    /**
     * Easily create a view
     * @param {string} key  View key/name
     * @param {object} data Object data to pass on to the view
     * @return StratoxItem (will return an instance of StratoxItem)
     */
    view(key, data) {
        let newObj = (this.#components[key] && this.#components[key].data) ? this.#components[key].data : {};
        Object.assign(newObj, data);
        this.#creator[key] = this.#initItemView(key, newObj);
        return this.#creator[key];
    }

    /**
     * Create mutable view
     * @param  {string|object} key  View key/name, either use it as a string or { viewName: "#element" }.
     * @param  {object} data        The view data
     * @param  {fn} call            callback
     * @return {static}
     */
    withView(key, data, call) {
        return Stratox.create(key, data, call);
    }

    /**
     * Easily create a form item
     * @param {string} type  Form type (text, textarea, select, checkbox, radio)
     * @param {string} name  Field name
     * @param {string} label Add label to field
     * @return StratoxItem (will  return an instance of StratoxItem)
     */
    form(name, data) {
        let newObj = (this.#components[name]) ? this.#components[name] : {};
        Object.assign(newObj, data);
        this.#creator[name] = StratoxItem.form(name, data);
        return this.#creator[name];
    }

    /**
     * Get componet object in its pure form
     * @return {object}
     */
    read() {
        return this.#components;
    }

    /**
     * Update view (will only execute changes to the view)
     * @param  {string} key  compontent name/key
     * @param  {object} data component data
     * @return {void}
     */
    update(key, data) {
        if(key === undefined) {
            this.#observer.notify();
            return this;
        }

        if(key instanceof StratoxItem) {
            this.#components[key.getName()] = key;

        } else {
            if(typeof data === "function") {
                data(this.#components[key])
            } else {
                this.#components[key] = data;
            }
        }

        this.#observer.set(this.#components);
        return this;
    }

    /**
     * Has view loaded?
     * @return {Boolean}
     */
    hasView() {
        return (typeof this.#response === "string");
    }

    /**
     * Get view response
     * @return {string}
     */
    getResponse() {
        return (this.#response ?? "");
    }

    /**
     * Trigger callback when script is ready
     * @param  {Function} fn
     * @return {void}
     */
    eventOnload(fn) {
        setTimeout(fn, 1);
    }

    /**
     * Set form values
     * @param {object}
     */
    setValues(values) {
        if(typeof values !== "object") throw new Error("The argument 1 has to be an object");
        this.#values = values;
    }
    
    /**
     * Advanced option to add view and form data 
     * @param {mixed} key  The view key/name or object form StratoxItem instance
     * @param {object} data Pass data to view
     */
    add(key, data) {
        if(key instanceof StratoxItem) {
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
     * Build the reponse
     * @param  {callable} call
     * @return {void}
     */
    async build(call) {
        let inst = this, dir = "";
        const handler = Stratox.getFormHandler();
        this.#field = new handler(this.#components, "view", Stratox.getConfigs(), this.#container);

        // Values are used to trigger magick methods
        this.#field.setValues(this.#values);

        dir = Stratox.getConfigs("directory");
        if(!dir.endsWith('/')) dir += '/';

        for (const [key, data] of Object.entries(this.#components)) {
            if(inst.#field.hasComponent(data.type)) {
                // Component is loaded...
                
            } else {
                if(data.compType !== "form") {
                    const extractFileName = key.split("#"), 
                    file = extractFileName[0],
                    compo = inst.#field.hasComponent(file);

                    inst.#incremented.push(false);
                    if(compo) {
                        handler.setComponent(key, compo);
                    } else {
                        const module = await import(dir+file+".js"+inst.#cacheParam());
                        for(const [k, fn] of Object.entries(module)) {
                            handler.setComponent(key, fn);
                        }
                    }
                    inst.#incremented[inst.#incremented.length-1] = true;
                    inst.#imported[file] = true;

                } else {
                    console.warn(`To use the field item ${data.type} you need to specify a formHandler in config!`);
                }
            }
        }

        if(inst.#incremented[inst.#incremented.length-1]) {            
            if(typeof call === "function") call(inst.#field);
        } else {
            if(inst.#incremented.length === 0 && inst.#field) if(typeof call === "function") call(inst.#field);
        }
    }

    /**
     * Build, process and execute to DOM
     * @param  {callable} call
     * @return {void}
     */
    execute(call) {
        let inst = this;

        if(Object.keys(this.#creator).length > 0) {
            for(const [k, v] of Object.entries(this.#creator)) {
                inst.add(v);
            }
        }
        
        this.#observer = new StratoxObserver(this.#components);

        inst.build(function(field) {

            inst.#observer.factory(function(jsonData, temp) {
                Stratox.viewCount++;
                // If response is not empty, 
                // then insert, processed components and insert to the document
                inst.#response = field.get();

                if(inst.#elem && (typeof inst.#response === "string") && inst.#response) {
                    inst.insertHtml();
                }
            });

            // Init listener and notify the listener
            inst.#observer.listener().notify();
            inst.#prop = false;

            // Auto init Magick methods to events if group field is being used
            if(field.hasGroupEvents() && inst.#elem) {

                inst.bindEvent(inst.#elem, "input", function(e) {
                    let key = this.dataset['name'], type = this.getAttribute("type"), value = (this.value ?? "");
                    if(type === "checkbox" || type === "radio") {
                        value = (this.checked) ? value : 0;
                    }
                    inst.editFieldValue(key, value);
                });

                inst.bindEvent(inst.#elem, "click", ".wa-field-group-btn", function(e) {
                    e.preventDefault();
                    const key = this.dataset['name'], pos = parseInt(this.dataset['position']);
                    inst.addGroupField(key, pos, this.classList.contains("after"));
                });

                inst.bindEvent(inst.#elem, "click", ".wa-field-group-delete-btn", function(e) {
                    e.preventDefault();
                    const key = this.dataset['name'], pos = parseInt(this.dataset['position']);
                    inst.deleteGroupField(key, pos, this.classList.contains("after"));
                });
            }

            // Callback
            if(typeof call === "function") {
                call.apply(inst, [inst.#observer]);
            }
        });       
    }

    /**
     * Traverse teh values from jointName
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
     * Observer
     * @return {StratoxObserver}
     */
    observer() {
        return this.#observer;
    }

    /**
     * Create a groupped field
     * @param {string} key
     * @param {int} pos
     * @param {bool} after (before (false) / after (true))
     */
    addGroupField(key, pos, after) {
        let inst = this, nameArr = key.split(","), values = this.#values;

        if(after) pos += 1;
        this.modifyValue(values, nameArr, function(obj, key) {
            if(!inst.isArray(obj[key])) obj[key] = Object.values(obj[key]);
            obj[key].splice(pos, 0, {});
        });

        this.#observer.notify();
        return values;
    }

    /**
     * Delete a groupped field
     * @param  {string} key
     * @param  {int} pos
     * @return {object}
     */
    deleteGroupField(key, pos) {
        let nameArr = key.split(","), values = this.#values;

        this.modifyValue(values, nameArr, function(obj, key) {
            if(obj[key].length > 1) obj[key].splice(pos, 1);
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
        let nameArr = Array(), values = this.#values;
        if(typeof key === "string") nameArr = key.split(",");
        this.modifyValue(values, nameArr, function(obj, key) {
            obj[key] = value;
        });
        return values;
    }

    /**
     * Get Indentifiers
     * @param  {object|string} data Should be string (view name) or object ({ viewName: "#element" })
     * @return {object}
     */
    static #getIdentifiers(data) {
        let name, el = null, keys;
        if(typeof data === "object") {
            keys = Object.keys(data);
            if(typeof keys[0] !== "string") throw new Error('Unrecognizable identifier type. Should be string (view name) or { viewName: "#element" }');
            name = keys[0];
            el = (data[name] ?? null);
        } else {
            if(typeof data === "string") {
                name = data;
            } else {
                throw new Error('Unrecognizable identifier type. Should be string (view name) or { viewName: "#element" }');
            }
        }
        return { name: name, elem: el };
    }

    /**
     * Insert HTML, will protect you from unintended DOM Propagation and 
     * keep High performance even tho DOM would be stuck in a 100000 loop!
     * @return {void}
     */
    insertHtml() {
        let inst = this;
        if(Stratox.getConfigs("popegation") === false || !inst.#prop) {
            inst.#prop = true;
            inst.html(inst.#response);
        } else {
            // DOM Propagation protection
            // Will be triggered if same DOM el is trigger consequently
            if(inst.#ivt !== undefined) clearTimeout(inst.#ivt);
            inst.#ivt = setTimeout(function() {
                inst.#prop = false;
                inst.html(inst.#response);
            }, 0);
        }
    }

    /**
     * Render Mustache
     * @param  {string} template Template with possible Mustache brackets
     * @param  {object} data     Object with items to pass to Mustache brackets
     * @return {string}          Return template with appended object inside of Mustache brackets
     */
    renderMustache(template, data) {
        return template.replace(/{{(.*?)}}/g, function(match, key) {
            return data[key.trim()] || ""; // Return the corresponding object property or an empty string if not found
        });
    }

    /**
     * Set selector/element
     * @param {object}
     */
    setSelector(elem) {
        if(typeof elem === "object") {
            return [elem];
        }
        if(elem.indexOf("#") === 0) {
            return [document.getElementById(elem.substring(1))];
        }
        return document.querySelectorAll(elem);
    }
    
    /**
     * Insert HTML into main rect
     * @param  {string} out
     * @return {void}
     */
    html(out) {
        this.#elem.forEach(function(el) {
            el.innerHTML = out;
        });
    }

    /**
     * Easy to work with event handler
     * @param  {array|spread} argument
     * @return {void}
     */
    bindEvent(...argument) {
        let call, elem, [selector, event, ...args] = argument;
        if(typeof selector === "string") selector = this.setSelector(selector);
        elem = call = args[0];
        if (typeof call !== "function") call = args[1];
        
        selector.forEach(function(el) {
            if(el) {
                const callable = function(e) {
                    let btn = e.target;
                    if (typeof elem === "string") btn = e.target.closest(elem);
                    if(btn) call.apply(btn, [e, btn]);
                }
                el.addEventListener(event, callable);
                el.off = function() {
                    el.removeEventListener(event, callable);
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
        if(typeof item !== "object") return false;
        return Array.isArray(item);
    }
    
    /**
     * Will pass on container
     * @param  {string} key
     * @param  {object} obj
     * @return {StratoxItem}
     */
    #initItemView(key, obj) {
        let inst = StratoxItem.view(key, obj);
        inst.setContainer(this.#container);
        return inst;
    }
    
    /**
     * Get timestamp (Can be used to auto clear cache)
     * @return {int}
     */
    #getTime() {
        if(!this.#timestamp) {
            this.#timestamp = new Date().getTime();
        }
        return this.#timestamp;
    }

    /**
     * Get cache parameter
     * @return {string}
     */
    #cacheParam() {
        if(Stratox.getConfigs("cache") === false) {
            return "?v="+this.#getTime();
        }
        return "";
    }
}