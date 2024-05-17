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
    #ready;

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
        if (typeof elem === "string") {
            this.#elem = elem;
        }
        this.#values = {};
        this.#container = new StratoxContainer();
        this.#container.set("view", this);
    }

    /**
     * Configurations
     * @param {object} configs
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
     * Get form handler
     * @return {StratoxBuilder} instance of StratoxBuilder
     */
    static getFormHandler() {
        const handler = Stratox.getConfigs("handlers").fields;
        if (handler === null || handler === undefined) {
            return StratoxBuilder;
        }
        if (typeof handler?.setComponent !== "function") {
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
        if (typeof fn !== "function") throw new Error("The argument 2 in @setComponent has to be a callable");
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
        Stratox.setComponent(key, fn);
    }

    /**
     * Create an immutable view (self-contained instance, e.g. modals)
     * @param  {string|object} key  View key/name, either use it as a string or { viewName: "#element" }.
     * @param  {object} data        The view data
     * @param  {object} args        Access container and/or before, complete callbacks
     * @return {StratoxItem}
     */
    static create(key, data, args) {
        const obj = this.#getIdentifiers(key);
        const inst = new Stratox(obj.elem);

        let config = { container: false, before: false, complete: false };
        const item = inst.view(obj.name, data);
        item.setContainer(inst.#container);

        if (typeof args === "function") {
            config.complete = args;
        } else {
            Object.assign(config, args);
            if (typeof config.container === "object") 
                for (const [key, value] of Object.entries(config.container)) {
                    inst.container().set(key, value);
                }
            if (typeof config.before === "function") config.before(inst, data);
        }

        inst.execute(config.complete);
        return inst;
    }
    
    /**
     * Open new Stratox instance
     * @param  {string} elem String element query selector
     * @return {Stratox}
     */
    open(elem) {
        return this.clone(elem);
    }    

    /**
     * Open new Stratox instance
     * @param  {string} elem String element query selector
     * @return {Stratox}
     */
    clone(elem) {
        return new Stratox(elem);
    }

    /**
     * Create mutable view
     * @param  {string|object} key  View key/name, either use it as a string or { viewName: "#element" }.
     * @param  {object} data        The view data
     * @param  {object} args        Access container and/or before, complete callbacks
     * @return {static}
     */
    withView(key, data, args) {
        if (typeof key === "function" || typeof key === "object") {
            const comp = this.#getSetCompFromKey(key);
            Stratox.setComponent(comp.name, comp.func);
            key = comp.name;
        }
        return Stratox.create(key, data, args);
    }

    /**
     * Create view and return instance of StratoxItem
     * @param  {object} key
     * @param  {object} data
     * @return {StratoxItem}
     */
    getViewComponent(key, data) {
        const item = this.clone();
        if (typeof key !== "object") {
            console.error("The getViewComponent function expects argument 1 (key) to be an object e.g. {keyNameID: viewFunction}");
        }
        return item.view(key, data);
    }

    /**
     * withView shortcut, but will directly return response
     * @param  {string|object} key  View key/name, either use it as a string or { viewName: "#element" }.
     * @param  {object} data        The view data
     * @param  {object} args        Access container and/or before, complete callbacks
     * @return {static}
     */
    partial(key, data, args) {
        const view = this.withView(...arguments);
        return view.getResponse();
    }

    /**
     * Attach view is the same as attachViewToEl
     * EXCEPT for that it will also prepare the element container!
     */
    attachPartial(view, data, call) {
        const elID = this.getID(this.genRandStr(6));
        const clone = this.attachViewToEl(`#${elID}`, view, data, call);
        return `<div id="${elID}"></div>`;
    }

    // DEPRECATED
    attachView(view, data, call) {
        return this.attachPartial(...arguments);
    }

    /**
     * Attach a view to specified element string
     * @example this.attachViewToEl("#table", table, data.table)
     * @param  {string} el   Element has string
     * @param  {function} view Expected view function
     * @param  {object} data Data passed to view
     * @return {self}
     */
    attachViewToEl(el, view, data, call) {
        const clone = this.clone();
        const item = clone.view(view, data);
        clone.setElement(el);
        // Ready should not be called outside of stratox class!
        this.#ready = function() {
            clone.execute();
            if (typeof call === "function") {
                call.apply(clone, [item, el]);
            }
        };
        return clone;
    }

    /**
     * Get a somewhat unique identifier
     * @param  {string} prefix Add a prefix to view count
     * @return {string}
     */
    getID(prefix) {
        if (typeof prefix !== "string") {
            prefix = "el";
        }
        return `stratox-${prefix}-${this.getViewCount()}`;
    }

    getUniqueElem(prefix) {
        if (typeof prefix !== "string") {
            prefix = "el";
        }
        return this.getID(`${this.genRandStr(8)}-${prefix}`);
    }

    /**
     * Get a random string
     * @param  {int} length
     * @return {string}
     */
    genRandStr(length) {
        return Math.random().toString(36).substring(2, 2 + length);
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
    _getConfig(key) {
        return Stratox.getConfigs(key);
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
        return this.#container;
    }

    /**
     * You can group a view and contain it inside a parent HTML tag
     * @param  {string} key
     * @param  {callable} callable
     * @return {StratoxItem}
     */
    group(key, callable) {
        const inst = this;
        Stratox.setComponent(key, function(data, container, helper, builder) {
            let out = callable.apply(inst.open(), [...arguments]);
            if (out instanceof Stratox) {
                out = out.execute();
            }
            if (typeof out !== "string") {
                throw new Error("The Stratox @group method needs to return a string or an instance of Stratox.");
            }
            return out;
        });
        this.view(key);
        return inst;
    }

    /**
     * Easily create a view
     * @param {string} key  View key/name
     * @param {object} data Object data to pass on to the view
     * @return {StratoxItem} (will return an instance of StratoxItem)
     */
    view(key, data) {
        if (typeof key === "function" || typeof key === "object") {
            const comp = this.#getSetCompFromKey(key);
            Stratox.setComponent(comp.name, comp.func);
            key = comp.name;
        }
        const newObj = (this.#components[key] && this.#components[key].data) ? this.#components[key].data : {};
        Object.assign(newObj, data);
        this.#creator[key] = this.#initItemView(key, newObj);
        return this.#creator[key];
    }
    
    /**
     * Easily create a form item
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
     * Form and component are the same, but below while the usage of the form is used in the context in a unit, component is not.
     * @param  {string} name The component name
     * @param  {object} data Pass data to the component (Not required)
     * @return {StratoxItem}
     */
    getComponent(name, data) {
        const inst = this.open();
        return inst.form(name, data);
    }

    /**
     * Get component object in its pure form
     * @return {object}
     */
    read() {
        return this.#components;
    }

    /**
     * Update view (will only execute changes to the view)
     * @param  {string} key  Component name/key
     * @param  {object} data Component data
     * @return {void}
     */
    update(key, data) {
        if (key === undefined) {
            this.#observer.notify();
            return this;
        }

        if (key instanceof StratoxItem) {
            this.#components[key.getName()] = key;
        } else {
            key = StratoxItem.getViewName(key);
            if (typeof data === "function") {
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
        if (typeof values !== "object") throw new Error("The argument 1 has to be an object");
        this.#values = values;
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
        if (typeof this.#elem === "string") {
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
        let dir = "";
        const handler = Stratox.getFormHandler();
        this.#field = new handler(this.#components, "view", Stratox.getConfigs(), this.#container);

        // Values are used to trigger magic methods
        this.#field.setValues(this.#values);

        dir = Stratox.getConfigs("directory");
        if (!dir.endsWith('/')) dir += '/';

        for (const [key, data] of Object.entries(this.#components)) {
            if (inst.#field.hasComponent(data.type)) {
                // Component is loaded...
            } else {
                if (data.compType !== "form") {
                    const extractFileName = key.split("#"), 
                          file = extractFileName[0],
                          compo = inst.#field.hasComponent(file);
                    inst.#incremented.push(false);

                    if (typeof compo === "function") {
                        handler.setComponent(key, compo);
                    } else {
                        const module = await import(/* @vite-ignore */ `${dir}${file}.js${inst.#cacheParam()}`);
                        for (const [k, fn] of Object.entries(module)) {
                            handler.setComponent(key, fn);
                        }
                    }
                    inst.#incremented[inst.#incremented.length - 1] = true;
                    inst.#imported[file] = true;
                } else {
                    console.warn(`To use the field item ${data.type} you need to specify a formHandler in config!`);
                }
            }
        }

        if (typeof call === "function" && 
            (inst.#incremented[inst.#incremented.length - 1] || inst.#incremented.length === 0 && inst.#field)) {
            call(inst.#field);
        }
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
        if (typeof this.#observer === "object") {
            this.#observer.notify();
            return this.getResponse();
        }
        
        // Start build and create views
        this.#prepareViews();
        this.#observer = new StratoxObserver(this.#components);
        inst.build(function(field) {
            inst.#observer.factory(function(jsonData, temp) {
                Stratox.viewCount++;
                // If response is not empty, 
                // then insert, processed components and insert to the document
                inst.#response = field.get();
                
                if (inst.#elem && (typeof inst.#response === "string") && inst.#response) {
                    inst.insertHtml();
                }
                // Trigger done on update
                if (typeof inst.#done === "function" && !wait) {
                    inst.#done.apply(inst, [field, inst.#observer, "update"]);
                }

                if (typeof inst.#ready === "function" && !wait) {
                    inst.#ready.apply(inst, [field, inst.#observer]);
                }
                wait = false;
            });

            // Init listener and notify the listener
            inst.#observer.listener().notify();
            inst.#prop = false;

            // Callback
            if (typeof call === "function") {
                call.apply(inst, [inst.#observer]);
            }
            if (field.hasGroupEvents()) {
                if (!inst.startFormEvents(field)) {
                    inst.bindGroupEvents("body");
                }
            }

            // Trigger done on load

            inst.eventOnload(function() {
                if (typeof inst.#done === "function" && !wait) inst.#done.apply(inst, [field, inst.#observer, "load"]);
                if (typeof inst.#onload === "function") inst.#onload.apply(inst, [field, inst.#observer]);
                if (typeof inst.#ready === "function") inst.#ready.apply(inst, [field, inst.#observer]);
            });

        });
        return this.getResponse();
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
            inst.bindEvent(elem, "input", function(e) {
                const key = this.dataset.name;
                const type = this.getAttribute("type");
                let value = (this.value ?? "");
                if (type === "checkbox" || type === "radio") {
                    value = this.checked ? value : 0;
                }
                inst.editFieldValue(key, value);
            });

            inst.bindEvent(elem, "click", ".wa-field-group-btn", function(e) {
                e.preventDefault();
                const key = this.dataset.name;
                const pos = parseInt(this.dataset.position, 10);
                inst.addGroupField(key, pos, this.classList.contains("after"));
            });

            inst.bindEvent(elem, "click", ".wa-field-group-delete-btn", function(e) {
                e.preventDefault();
                const key = this.dataset.name;
                const pos = parseInt(this.dataset.position, 10);
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
            for (const [k, v] of Object.entries(this.#creator)) {
                inst.add(v);
            }
        }
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
        const nameArr = key.split(",");
        const values = this.#values;

        if (after) pos += 1;
        this.modifyValue(values, nameArr, (obj, key) => {
            if (!inst.isArray(obj[key])) obj[key] = Object.values(obj[key]);
            obj[key].splice(pos, 0, {});
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
        const nameArr = key.split(",");
        const values = this.#values;

        this.modifyValue(values, nameArr, (obj, key) => {
            if (obj[key].length > 1) obj[key].splice(pos, 1);
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
        const nameArr = Array.isArray(key) ? key : key.split(",");
        this.modifyValue(this.#values, nameArr, (obj, key) => {
            obj[key] = value;
        });
        return this.#values;
    }

    /**
     * Get Identifiers
     * @param  {object|string} data Should be string (view name) or object ({ viewName: "#element" })
     * @return {object}
     */
    static #getIdentifiers(data) {
        let name, el = null;
        if (typeof data === "object") {
            const keys = Object.keys(data);
            if (typeof keys[0] !== "string") throw new Error('Unrecognizable identifier type. Should be string (view name) or { viewName: "#element" }');
            name = keys[0];
            el = data[name] ?? null;
        } else {
            if (typeof data === "string") {
                name = data;
            } else {
                throw new Error('Unrecognizable identifier type. Should be string (view name) or { viewName: "#element" }');
            }
        }
        return { name, elem: el };
    }

    /**
     * Insert HTML, will protect you from unintended DOM Propagation and 
     * keep High performance even though DOM would be stuck in a 100000 loop!
     * @return {void}
     */
    insertHtml() {
        const inst = this;
        if (Stratox.getConfigs("popegation") === false || !inst.#prop) {
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
     * Set selector/element
     * @param {object}
     */
    setSelector(elem) {
        if (typeof elem === "object") {
            return [elem];
        }
        if (elem.indexOf("#") === 0) {
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
        this.getElement().forEach(el => {
            if (el) el.innerHTML = out;
        });
    }

    /**
     * Easy to work with event handler
     * @param  {array|spread} argument
     * @return {void}
     */
    bindEvent(...args) {
        const [selector, event, elem, call] = args;
        const elements = typeof selector === "string" ? this.setSelector(selector) : selector;
        const callback = typeof elem === "function" ? elem : call;
        const target = typeof elem === "string" ? elem : null;

        elements.forEach(el => {
            if (el) {
                const eventHandler = function(e) {
                    let targetElem = e.target;
                    if (target) targetElem = e.target.closest(target);
                    if (targetElem) callback.apply(targetElem, [e, targetElem]);
                };
                el.addEventListener(event, eventHandler);
                el.off = () => {
                    el.removeEventListener(event, eventHandler);
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
        return Stratox.getConfigs("cache") === false ? `?v=${this.#getTime()}` : "";
    }

    /**
     * Return possible component setter 
     * @param  {function|object} key
     * @return {object}
     */
    #getSetCompFromKey(key) {
        if (typeof key === "object") {
            const keys = Object.keys(key);
            const func = key[keys[0]];
            return { name: `${func.name}#${keys[0]}`, func };
        }
        return { name: key.name, func: key };
    }

    /**
     * Render Mustache
     * @param  {string} template Template with possible Mustache brackets
     * @param  {object} data     Object with items to pass to Mustache brackets
     * @return {string}          Return template with appended object inside of Mustache brackets
     */
    renderMustache(template, data) {
        return template.replace(/{{(.*?)}}/g, (match, key) => data[key.trim()] || "");
    }
}
