/**
 * Stratox
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import { StratoxDom as $ } from './StratoxDom.js';
import { StratoxContainer } from './StratoxContainer.js';
import { StratoxBuilder } from './StratoxBuilder.js';
import { StratoxObserver } from './StratoxObserver.js';
import { StratoxItem } from './StratoxItem.js';

export class Stratox {

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
    #prop = false;

    static viewCount = 0; // Total active views

    /**
     * Default Configs
     * @type {object}
     */
    static #configs = {
        xss: true,
        directory: "",
        popegation: true // Automatic DOM popegation protection
    };

    /**
     * Start the Stratox JS instance 
     * @param  {string} elem Pass in element as string e.g. (#elemID, .elemClass, tagname)
     * @return {self}
     */
    constructor(elem) {
        if(typeof elem === "string") this.#elem = $(elem);
        this.#values = {};

        this.#container = new StratoxContainer();
        this.#container.set("view", this);
    }

    /**
     * Configurations
     * @param {object}
     */
    static setConfigs(configs) {
        $.extend(this.#configs, configs);
    }

    /**
     * You can pre import or statically prepare view with this method
     * @param  {string}   key View name/key
     * @param  {Function} fn
     * @return {void}
     */
    static prepareView(key, fn) {
        if(typeof fn !== "function") throw new Error("The argument 2 in @prepareView has to be a callable");
        StratoxBuilder.setComponent(key, fn, this);
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
        $.extend(newObj, data);
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
        $.extend(newObj, data);
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
        if(typeof values === "object") throw new Error("The argument 1 has to be an object");
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
     * Get config from configurations
     * @param  {string|empty} key
     * @return {mixed}
     */
    getConfigs(key) {
        return (typeof key === "string") ? Stratox.#configs[key] : Stratox.#configs;
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
        this.#field = new StratoxBuilder(this.#components, "view", this.getConfigs(), this.#container);

        // Values are used to trigger magick methods
        this.#field.setValues(this.#values);

        dir = inst.getConfigs("directory");
        if(!dir.endsWith('/')) dir += '/';

        for (const [key, data] of Object.entries(this.#components)) {
            if(inst.#field.hasComponent(data.type)) {
                // Component is loaded...
                
            } else {
                inst.#incremented.push(false);
                const module = await import(dir+key+".js");
                inst.#incremented[inst.#incremented.length-1] = true;
                inst.#imported[key] = true;
                
                $.each(module, function(k, fn) {
                    StratoxBuilder.setComponent(key, fn);
                });
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
     * @param  {[type]} call [description]
     * @return {[type]}      [description]
     */
    execute(call) {
        let inst = this;

        if(!$.isEmptyObject(this.#creator)) $.each(this.#creator, function(k, v) {
            inst.add(v);
        });
        
        this.#observer = new StratoxObserver(this.#components);

        inst.build(function(field) {

            inst.#observer.factory(function(jsonData, temp) {
                Stratox.viewCount++;

                // Insert all processed HTML componets and place them into the document
                inst.#response = field.get();
                if(inst.#elem) inst.insertHtml();
            });

            // Init listener and notify the listener
            inst.#observer.listener().notify();
            inst.#prop = false;

            // Auto init Magick methods to events if group field is being used
            if(field.hasGroupEvents() && inst.#elem) {
                inst.#elem.on("input", function(e) {
                    let inp = $(e.target), key = inp.data("name"), value = inp.val();
                    inst.editFieldValue(key, inp.val());
                });

                inst.#elem.on("click", ".wa-field-group-btn", function(e) {
                    e.preventDefault();
                    let btn = $(this), key = btn.data("name"), pos = parseInt(btn.data("position"));
                    inst.addGroupField(key, pos, btn.hasClass("after"));
                });

                inst.#elem.on("click", ".wa-field-group-delete-btn", function(e) {
                    e.preventDefault();
                    let btn = $(this), key = btn.data("name"), pos = parseInt(btn.data("position"));
                    inst.deleteGroupField(key, pos, btn.hasClass("after"));
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
        let nameArr = key.split(","), values = this.#values;

        if(after) pos += 1;
        this.modifyValue(values, nameArr, function(obj, key) {
            if(!$.isArray(obj[key])) obj[key] = Object.values(obj[key]);
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
        let nameArr = key.split(","), values = this.#values;
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
     * keep High performance even tho DOm would be stuck in a 100000 loop!
     * @return {void}
     */
    insertHtml() {
        let inst = this;
        if(inst.getConfigs("popegation") === false || !inst.#prop) {
            inst.#prop = true;
            inst.#elem.html(inst.#response);
        } else {

            // DOM Propagation protection
            // Will be triggered if same DOM el is trigger consequently
            if(inst.#ivt !== undefined) clearTimeout(inst.#ivt);
            inst.#ivt = setTimeout(function() {
                inst.#prop = false;
                inst.#elem.html(inst.#response);
            }, 0);
        }
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
    
}