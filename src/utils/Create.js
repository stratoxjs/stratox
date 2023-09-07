import { StratoxDom as $ } from '../StratoxDom.js';

export class Create {

    #compType = "";

    type = "";
    label = "";
    description = "";
    name = "";
    attr = {};
    config = {};
    fields = {};
    items = {};
    value = "";
    data = {}; // Merge all values to data

    constructor(type) {
        if(typeof type !== "string" && typeof type !== "number") throw new Error('The type/key component name should be a string value and not ('+(typeof type)+').');
        this.type = type;
        return this;
    }

    static form(type, name, label) {
        let inst = new Create(type);
        inst.#compType = "form";
        inst.setName(name ?? "");
        inst.setLabel(label ?? "");
        return inst;
    }

    static view(key, data) {
        if(typeof key !== "string" && typeof key !== "number") throw new Error('Argumnent 1 (view key/name) is required and should be a string');
        if(typeof data !== "object") throw new Error('Argumnent 2 (view data) is required and should be an object');

        let inst = new Create(key);
        inst.#compType = "view";
        inst.setData(data);
        inst.setName(key);
        return inst;
    }

    getType() {
        return this.type;
    }

    getName() {
        return this.name;
    }

    getCompType() {
        return this.#compType;
    }

    setLabel(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1 is not a string or number');
        this.label = str;
        return this;
    }

    setDescription(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1 is not a string or number');
        this.description = str;
        return this;
    }

    setName(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1 is not a string or number');
        this.name = str;
        return this;
    }

    setAttr(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1 is not a object');
        this.attr = obj;
        return this;
    }

    setConfig(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1 is not a object');
        this.config = obj;
        return this;
    }

    setFields(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1 is not a object');
        let newObj = {};
        $.each(obj, function(k, v) {
            if(v instanceof Create ) {
                newObj[v.getName()] = v.get();
            } else {
                newObj[k] = v;
            }
        });

        this.fields = newObj;
        return this;
    }

    setItems(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1 is not a object');
        this.items = obj;
        return this;
    }

    setValue(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1 is not a string or number');
        this.value = str;
        return this;
    }

    setData(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1 is not a object');
        this.data = obj;
        return this;
    }

    get() {
        let newObj = {
            type: this.type,
            label: this.label,
            description: this.description,
            name: this.name,
            attr: this.attr,
            config: this.config,
            fields: this.fields,
            items: this.items,
            data: this.data,
            value: this.value
        };

        $.extend(newObj, this.data);
        return newObj;
    }
}