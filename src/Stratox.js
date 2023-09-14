/**
 * Stratox
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import { StratoxDom as $ } from './StratoxDom.js';
import { StratoxBuilder } from './StratoxBuilder.js';
import { StratoxObserver } from './StratoxObserver.js';
import { Create } from './utils/Create.js';

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

    static #staticImport = [];

    static #configs = {
        xss: true,
        directory: ""
    };

    constructor(obj) {
        this.#elem = $(obj);
        this.#values = {};
    }

    /**
     * Will resolve the relative path
     * @param  {string} dir
     * @return {string}
     */
    static resolve(dir) {
        if(typeof dir !== "string") dir = "";
        var file = window.location.pathname.split("/"), lastpart = file.pop(), path = file.join("/");
        return path+"/"+dir;
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
     * Easily create a view
     * @param {string} key  View key/name
     * @param {object} data Object data to pass on to the view
     * @return Create (will return an instance of Create)
     */
    view(key, data) {
        let newObj = (this.#components[key] && this.#components[key].data) ? this.#components[key].data : {};
        $.extend(newObj, data);
        this.#creator[key] = Create.view(key, newObj);
        return this.#creator[key];
    }

    /**
     * Easily create a form item
     * @param {string} type  Form type (text, textarea, select, checkbox, radio)
     * @param {string} name  Field name
     * @param {string} label Add label to field
     * @return Create (will  return an instance of Create)
     */
    form(name, data) {
        let newObj = (this.#components[name]) ? this.#components[name] : {};
        $.extend(newObj, data);
        this.#creator[name] = Create.form(name, data);
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

        if(key instanceof Create) {
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
     * @param {mixed} key  The view key/name or object form Create instance
     * @param {object} data Pass data to view
     */
    add(key, data) {
        if(key instanceof Create) {
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
     * Build the reponse
     * @param  {callable} call
     * @return {void}
     */
    async build(call) {
        let inst = this, dir = "";
        this.#field = new StratoxBuilder(this.#components, "view", this.getConfigs(), this);

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
                // Insert all processed HTML componets and place them into the document
                if(inst.#elem) inst.#elem.html(field.get());
            });

            // Init listener and notify the listener
            inst.#observer.listener().notify();

            // Auto init Magick methods to events if group field is being used
            if(field.hasGroupEvents()) {
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
            if(typeof call === "function") call(inst.#observer);
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
    
}