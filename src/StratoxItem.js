import { StratoxContainer } from './StratoxContainer.js';

export class StratoxItem {

    compType = "";
    #container;

    type = "";
    label = "";
    description = "";
    name = "";
    attr = {};
    config = {};
    fields = {};
    items = {};
    value = "";
    hasFields = false;
    data = {}; // Merge all values to data

    constructor(type) {
        if(typeof type !== "string" && typeof type !== "number") throw new Error('Argumnent 1: The type/key component name should be a string value and not ('+(typeof type)+').');
        this.type = type;
        return this;
    }

    static form(name, data) {
        let inst = new StratoxItem(name);
        
        inst.compType = "form";
        inst.setType("text");
        inst.setName(name);
        return inst.merge(data);
    }

    static view(key, data) {
        if(typeof data !== "object") throw new Error('Argumnent 2 (view object data): In StratoxItem.view is required and should be an object');

        let inst = new StratoxItem(key);
        inst.compType = "view";
        inst.setData(data);
        inst.setName(key);
        return inst;
    }

    static fromData(type, data) {
        let inst = new StratoxItem(type);
        return inst.merge(data);
    }

    setContainer(container) {
        if(!(container instanceof StratoxContainer)) throw new Error('Must be an intsance of StratoxContainer');
        this.#container = container;
    }

    getType() {
        return this.type;
    }

    getName() {
        return this.name;
    }

    getCompType() {
        return this.compType;
    }

    setLabel(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1: Is not a string or number');
        this.label = str;
        return this;
    }

    setDescription(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1: Is not a string or number');
        this.description = str;
        return this;
    }

    setType(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1: Is not a string or number');
        this.type = str;
        return this;
    }

    setName(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1: Is not a string or number');
        this.name = str;
        return this;
    }

    setAttr(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1: Is not a object');
        this.attr = obj;
        return this;
    }

    setConfig(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1: Is not a object');
        this.config = obj;
        return this;
    }

    setFields(obj) {
        this.hasFields = true;
        if(typeof obj !== "object") throw new Error('Argumnent 1: Is not a object');
        let newObj = {};
        for(const [k, v] of Object.entries(obj)) {
            if(v instanceof StratoxItem ) {
                newObj[v.getName()] = v.get();
            } else {
                newObj[k] = v;
            }
        };
        this.fields = newObj;
        return this;
    }

    setItems(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1: Is not a object');
        this.items = obj;
        return this;
    }

    setValue(str) {
        if(typeof str !== "string" && typeof str !== "number") throw new Error('Argumnent 1 is not a string or number');
        this.value = str;
        return this;
    }

    setData(obj) {
        if(typeof obj !== "object") throw new Error('Argumnent 1: Is not a object');
        this.data = obj;
        return this;
    }

    set(obj) {
        if(this.compType === "form") {
            if(typeof obj === "function") {
                obj(this);
            } else {
                Object.assign(this, obj);
            }
            
        } else {
            if(typeof obj === "function") {
                obj(this.data);
            } else {
                Object.assign(this.data, obj);
            }
        }
        return this;
    }

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
            value: this.value
        };
    }

    merge(data) {
        Object.assign(this, data);
        return this;
    }

    get() {
        let newObj = this.getObj();
        Object.assign(newObj, this.data);
        return newObj;
    }

    update() {

        if(this.#container) {
            this.#container.get("view").update();
        }
    }

}