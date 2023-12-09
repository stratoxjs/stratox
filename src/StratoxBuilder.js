/**
 * Stratox builder
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import { StratoxItem } from './StratoxItem.js';

export class StratoxBuilder {

    static _factory = {};
    
    json;
    value = "";
    label = "";
    description = "";
    values = null;
    name = "";
    nameJoin = "";
    nameSplit = Array();
    index = 0;
    key;
    fields = {};
    attr = {};
    hasFields = true;
    config = {};
    configList = {};
    settings = {}
    containerInst;

    #values = {};
    #helper;
    #hasGroupEvents = false;

    constructor(json, key, settings, container) {
        this.json = json;
        this.key = key;
        this.settings = settings;
        this.containerInst = container;
    }

    /**
     * Create a new component
     * @param {string}   key component name/key
     * @param {callable} fn
     */
    static setComponent(key, fn) {
        if(typeof fn !== "function") throw new Error("The argument 2 in @prepareView has to be a callable");
        this._factory[key] = fn;
    }

    /**
     * Get template
     * @param  {string} key
     * @return {callable|false}
     */
    getComponent(key) {
        return (StratoxBuilder._factory[key]) ? StratoxBuilder._factory[key] : false;
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
        let attr = "", objFor = Object.assign(defArgs, this.attr);
        for(const [key, value] of Object.entries(objFor)) attr += ' '+key+'="'+value+'"';
        return attr;
    }

    /**
     * This will make it posible for you to build manual forms in your views
     * @param  {string} fieldName
     * @param  {object} args
     * @return {static}
     */
    withField(fieldName, args) {
        let clone = new this.constructor();
        const item = StratoxItem.form(fieldName, args);
        Object.assign(clone, item.get());
        return clone;
    }

    /**
     * Set form values
     * All sets except for value should be a new instance to keep immutability
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
        if(this.containerInst.get("view").isArray(this.value)) {
            return this.value.includes(value);
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
        return (typeof this.data.fields === "object" && this.hasFields === false);
    }

    /**
     * Used to create group fields
     * @param  {Function} callback   Factory
     * @return {string}
     */
    groupFactory(callback, builder) {
        this.#hasGroupEvents = true;

        let out = "", fields = {}, inst = this, nk = 0, nj = inst.nameJoin, cloneFields = Object.assign({}, inst.fields), 
        length = this.getValueLength(1), config = this.config;
        if(!this.containerInst.get("view").isArray(this.value)) this.value = Array("");

        if(typeof this.value === "object") for(const [k, a] of Object.entries(this.value)) {
            let o = "", btnIndex = inst.index, nestedNames = (config.nestedNames !== undefined && config.nestedNames === true);

            if(config.controls !== undefined && config.controls === true) {
                o += '<div class="group holder relative card-1 border" data-length="'+length+'">';
                o += '<a class="wa-field-group-delete-btn pad form-group-icon abs right top over-2" data-name="'+nj+'" data-key="'+inst.key+'" data-index="'+btnIndex+'" data-position="'+k+'" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M2 30 L30 2 M30 30 L2 2" /></svg></a>';
                o += '<a class="wa-field-group-btn form-group-icon before abs middle top over-2" data-name="'+nj+'" data-key="'+inst.key+'" data-index="'+btnIndex+'" data-position="'+k+'" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M16 2 L16 30 M2 16 L30 16" /></svg></a>';
            }

            if(typeof cloneFields === "object") for(const [name, arr] of Object.entries(cloneFields)) {
                let fk = (nestedNames) ? nj+","+nk+","+name : name;
                fields[fk] = arr;
                o += inst.#html(fields, false);
                // Is grp then skip index (see @html and @#build). (Changed)
                //o += inst.#html(fields, (arr.type === "group"));
                fields = {};
            };

            nk++;
            if(config.controls !== undefined && config.controls === true) {
                o += '<a class="wa-field-group-btn form-group-icon after abs middle bottom over-2" data-name="'+nj+'" data-key="'+inst.key+'" data-index="'+btnIndex+'" data-position="'+k+'" href="#"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M16 2 L16 30 M2 16 L30 16" /></a>';
                o += '</div>';
            }
            out += callback(o, a);
        }
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
        if(this.value && this.containerInst.get("view").isArray(this.value)) length = this.value.length;
        if(typeof minVal === "number" && length <= minVal) length = minVal;
        return length;
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
        this.hasFields = (typeof this.data.hasFields === "boolean") ? this.data.hasFields : false;

        Object.assign(this.configList, this.config);
        this.#buildFieldNames();
        this.attr['data-name'] = this.nameJoin;

        let val = this.#padFieldValues(), out, fn, formatedData;
        if((typeof this[this.data.type] === "function") || (fn = this.getComponent(this.data.type))) {

            const helper = this.#getHelper();

            if(typeof fn === "function") {
                out = fn.apply(this.containerInst.get("view"), [(this.data.data ?? {}), this.containerInst, helper, this]);
            } else {
                out = this.#getField(this.data.type);
            }         
            this.index++;
            return (out ? out : "");

        } else {
            this.containerInst.get("view").observer().stop();
            console.error('The component/view named "'+this.data.type+'" does not exist.');
        }
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
        if(!this.#helper) {
            this.#helper = this.containerInst.get("view")._getConfig("handlers").helper;
            if(typeof this.#helper === "function") this.#helper = this.#helper(this);
        }
        return this.#helper;
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