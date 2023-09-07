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
    #imported = [];
    #elem;
    #values = {};
    #creator = [];

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
    addView(key, data) {
        this.#creator.push(Create.view(key, data));
        return this.#creator[this.#creator.length-1];
    }

    /**
     * Easily create a form item
     * @param {string} type  Form type (text, textarea, select, checkbox, radio)
     * @param {string} name  Field name
     * @param {string} label Add label to field
     * @return Create (will  return an instance of Create)
     */
    addForm(type, name, label) {
        this.#creator.push(Create.form(type, name, label));
        return this.#creator[this.#creator.length-1];
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
     * Get config from configurations
     * @param  {string|empty} key
     * @return {mixed}
     */
    getConfigs(key) {
        return (typeof key === "string") ? Stratox.#configs[key] : Stratox.#configs;
    }

    /**
     * Build the reponse
     * @param  {callable} call
     * @return {void}
     */
    build(call) {
        let inst = this;
        this.#field = new StratoxBuilder(this.#components, "view", this.getConfigs(), this);

        // Values are used to trigger magick methods
        this.#field.setValues(this.#values);

        $.each(this.#components, function(key, data) {
            if(inst.#field.hasComponent(data.type)) {
                // Component is loaded...
                
            } else {
                inst.#imported.push(false);
                inst.#importTemplate(inst.getConfigs("directory")+key+".js", function(mod) {
                    
                    // Add support for multiple exported components
                    $.each(mod, function(k, fn) {
                        StratoxBuilder.setComponent(key, fn);
                    });

                    if(inst.#imported[inst.#imported.length-1]) {
                        if(typeof call === "function") call(inst.#field);
                    }
                });
            }
        });

        if(inst.#imported.length === 0) if(typeof call === "function") call(inst.#field);
    }

    /**
     * Build, process and execute to DOM
     * @param  {[type]} call [description]
     * @return {[type]}      [description]
     */
    execute(call) {
        let inst = this;

        if(typeof this.#creator === "object" && this.#creator.length > 0) {
            for(let i = 0; i < this.#creator.length; i++) this.add(this.#creator[i]);
        }
        this.#observer = new StratoxObserver(this.#components);

        inst.build(function(field) {

            inst.#observer.factory(function(jsonData, temp) {
                // Insert all processed HTML componets and place them into the document
                inst.#elem.html(field.get());
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
     * Import dynamic template
     * @param  {string}   file
     * @param  {Function} callback
     * @return {void}
     */
    async #importTemplate(file, callback) {

        let le, inst = this;
        
        le = this.#imported.length;
        try {
            const module = await import(file);
            setTimeout(function() {
                inst.#imported[le-1] = true;
                if(typeof callback === "function") callback(module);
            }, 10);
            //return module;

        } catch (error) {
            console.error('Stratox import error:', error);
        }
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