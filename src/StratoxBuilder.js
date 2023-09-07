/**
 * Stratox builder
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import { StratoxDom as $ } from './StratoxDom.js';
import { StratoxTemplate } from './StratoxTemplate.js';
import { Entities } from './utils/Entities.js';

export class StratoxBuilder extends StratoxTemplate {

    static #factory = {};
    #values = {};
    #hasGroupEvents = false;

    /**
     * Create a new component
     * @param {string}   key component name/key
     * @param {callable} fn
     */
    static setComponent(key, fn, model) {
        if(typeof fn !== "function") throw new Error("The argument 2 in @prepareView has to be a callable");
        this.#factory[key] = fn;
    }

    /**
     * Get template
     * @param  {string} key
     * @return {callable|false}
     */
    getComponent(key) {
        return (StratoxBuilder.#factory[key]) ? StratoxBuilder.#factory[key] : false;
    }

    /**
     * Check if component exists
     * @param  {string}  key
     * @return {Boolean}
     */
    hasComponent(key) {
        return ((typeof this[key] === "function") || this.getComponent(key));
    }

    /**
     * Will help you create default field attributes that can be overwritable 
     * @param  {object} defArgs add defaults
     * @return {string}
     */
    getAttr(defArgs) {
        if(typeof defArgs !== "object") defArgs = {};
        let attr = "", objFor = $.extend(defArgs, this.attr);
        for(const [key, value] of Object.entries(objFor)) attr += ' '+key+'="'+value+'"';
        return attr;
    }

    /**
     * Set form values
     * @param object Global values input/field name (example: { name: "About us", permlink: "about-us" } )
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
        if(item === null || item === undefined) return false;
        return (typeof item[Symbol.iterator] === "function");
    }

    /**
     * Can be used to check if a item in fields "items" is checked/slected
     * @param  {mixed}  value
     * @return {Boolean}
     */
    isChecked(value) {
        if($.isArray(this.value)) {
            return $.inArray(value, this.value);
        }
        return (this.value == value);
    }

    /**
     * Get a unique field ID you could use if you want for whatever (e.g. element ID)
     * @return {string}
     */
    getFieldID() {
        return "wa-fi-"+this.key+"-"+this.index;
    }

    hasGroupEvents() {
        return this.#hasGroupEvents;
    }

    /**
     * Used to create group fields
     * @param  {Function} callback   Factory
     * @return {string}
     */
    groupFactory(callback, builder) {

        this.#hasGroupEvents = true;

        let out = "", fields = {}, inst = this, nk = 0, nj = inst.nameJoin, cloneFields = $.extend({}, inst.fields), 
        length = this.getValueLength(1), config = this.config;
        if(!$.isArray(this.value)) this.value = Array("");

        $.each(this.value, function(k, a) {
            let o = "", btnIndex = inst.index, nestedNames = (config.nestedNames !== undefined && config.nestedNames === true);

            if(config.controls !== undefined && config.controls === true) {
                o += '<div class="group holder relative card-1 border" data-length="'+length+'">';
                o += '<a class="wa-field-group-delete-btn pad form-group-icon abs right top over-2" data-name="'+nj+'" data-key="'+inst.key+'" data-index="'+btnIndex+'" data-position="'+k+'" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M2 30 L30 2 M30 30 L2 2" /></svg></a>';
                o += '<a class="wa-field-group-btn form-group-icon before abs middle top over-2" data-name="'+nj+'" data-key="'+inst.key+'" data-index="'+btnIndex+'" data-position="'+k+'" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M16 2 L16 30 M2 16 L30 16" /></svg></a>';
            }

            $.each(cloneFields, function(name, arr) {
                //arr.config = $.extend((arr.config ?? {}), config);
                let fk = (nestedNames) ? nj+","+nk+","+name : name;
                fields[fk] = arr;
                o += inst.#html(fields, false);

                // Is grp then skip index (see @html and @#build). (Changed)
                //o += inst.#html(fields, (arr.type === "group"));
                fields = {};
            });

            nk++;
            if(config.controls !== undefined && config.controls === true) {
                o += '<a class="wa-field-group-btn form-group-icon after abs middle bottom over-2" data-name="'+nj+'" data-key="'+inst.key+'" data-index="'+btnIndex+'" data-position="'+k+'" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M16 2 L16 30 M2 16 L30 16" /></a>';
                o += '</div>';
            }
            out += callback(o, a);
        });
        return out;
    }
    
    /**
     * Get field html code  
     * @param  {object} values can set values here if you want
     * @return {string}
     */
    get() {
        //if(values) this.values = values;
        return this.#html(this.json);
    }  

    /**
     * Check and get of validate item exists
     * @param  {string} key
     * @return {object}
     */
    getValidateItem(key) {
    	if(this.data && this.data.validate && this.data.validate[key]) {
    		return this.data.validate[key];
    	}
    	return false;
    }

    /**
     * Return and validation, if exsist else return false (This method will change)
     * @param  {string} key    validation key
     * @param  {mixed} argKey compare validation argumnet
     * @return {string|bool}
     */
    getValidation(key, argKey) {
    	let vl;
    	return ((vl = this.getValidateItem(key)) && vl[argKey] !== undefined) ? vl[argKey] : false;
    }

    /**
     * Used mainly to calculate number of custom fields that is grouped
     * @param  {int} minVal change return min number
     * @return {int}
     */
    getValueLength(minVal) {
        let length = 0;
        if(this.value && $.isArray(this.value)) length = this.value.length;
        if(typeof minVal === "number" && length <= minVal) length = minVal;
        return length;
    }

    /**
     * Format string object
     * @param  {string} val
     * @return {Entities|String}
     */
    format(val) {
        return new Entities(val);
    }

    /**
     * Generate HTML
     * @param  {object} fields
     * @return {string}
     */
    #html(fields, formatData) {
        let build = "";
        if(fields) for(const [name, data] of Object.entries(fields)) {
            this.data = data;
            this.name = (typeof this.data.name === "string") ? this.data.name : name;
            build += this.#build(formatData);
        }
        return build;
    }

    /**
     * Put things together
     * @return {void}
     */
    #build(formatData) {
        // Set some defaults        
        this.value = (typeof this.data.value === "string") ? this.data.value : "";
        this.label = (typeof this.data.label === "string") ? this.data.label : "";
        this.description = (typeof this.data.description === "string") ? this.data.description : "";
        this.attr = (typeof this.data.attr === "object") ? this.data.attr : {};
        this.fields = (typeof this.data.fields === "object") ? this.data.fields : {};
        this.config = (typeof this.data.config === "object") ? this.data.config : {};

        $.extend(this.configList, this.config);
        this.#buildFieldNames();
        this.attr['data-name'] = this.nameJoin;

        let val = this.#padFieldValues(), out, fn, formatedData;
        if((typeof this[this.data.type] === "function") || (fn = this.getComponent(this.data.type))) {
            if(typeof fn === "function") {
                out = fn(this.#autoProtectData(this.data.data ?? {}), this.data.type, this.model, this);
            } else {
                out = this[this.data.type]();
            }         
            this.index++;
            return (out ? out : "");

        } else {
            throw new Error('The component/view named "'+this.data.type+'" does not exist.');
        }
    }

    /**
     * Auto protect data (can be enabled/disabled)
     * @param  {object} data
     * @return {object} protected data
     */
    #autoProtectData(data) {
        let inst = this;
        if(typeof data === "object") $.each(data, function(k, value) {
            if(typeof value === "object" && !(value instanceof String)) {
                return inst.#autoProtectData(value);

            } else {
                if((typeof value === "string" || typeof value === "number")) {
                    if(inst.settings.xss) value = inst.format(value).xss();
                    data[k] = inst.format(value);
                }
            }
        });
        return data;
    }

    /**
     * Will pad empty field values win en empty string value
     * @return {object}
     */
    #padFieldValues() {
        if(this.values) this.#values = this.values;
        let inst = this, valueObj = this.#values, hasAVal = false, key,
        nameSplit = this.nameSplit, li = (nameSplit.length-1), last = nameSplit[li];

        if(!valueObj) valueObj = {};

        for(let i = 0; i < li; i ++) {
            key = nameSplit[i];
            if(valueObj[key] !== undefined) valueObj = valueObj[key];  
        }

        if(valueObj[last] !== undefined) {
            this.value = valueObj[last];
        } else {
            let isNested = Object.entries(this.fields).length;
            if(isNested > 0) {
                valueObj[last] = [{}];

            } else {
                if(typeof valueObj[last] !== "object") valueObj = {}
                valueObj[last] = "";
                if(!this.value) this.value = "";
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
        let nameSplit = this.name.split(","), newName = "";
        this.nameSplit = this.name.split(",");
        if(nameSplit.length > 1) {
            newName = nameSplit.shift();
            for(let i = 0; i < nameSplit.length; i ++) {
                newName += "["+nameSplit[i]+"]";
            }
            this.name = newName;
        }
    }

}