/**
 * Stratox template
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import { StratoxBuilder } from '../src/StratoxBuilder.js';

export class FormTemplateFields extends StratoxBuilder {


    /**
     * Regular input field
     * @return {string}
     */
    text() {
        let inst = this;
        return this.container(function() {
            return inst.input();
        });
    }

    /**
     * Password input field
     * @return {string}
     */
    password() {
        let inst = this;
        return this.container(function() {
            let out =  inst.input({ type: "password" });
            return out;
        });
    }

    /**
     * Date input field
     * @return {string}
     */
    date() {
        let inst = this;
        return this.container(function() {
            return inst.input({ type: "date" });
        });
    }

    /**
     * Date time input field
     * @return {string}
     */
    datetime() {
        let inst = this;
        return this.container(function() {
            return inst.input({ type: "datetime-local" });
        });
    }

    /**
     * Hidden input field
     * @return {string}
     */
    hidden() {
        let inst = this;
        return inst.input({ type: "hidden" });
    }

    /**
     * Textarea field
     * @return {string}
     */
    textarea() {
        let inst = this, attr = this.getAttr({
            name: this.name,
            "data-index": this.index
        });
        
        return this.container(function() {
            return '<textarea'+attr+'>'+inst.value+'</textarea>';
        }); 
    }
    
    /**
     * Select field
     * @return {string}
     */
    select() {
        let inst = this, attrName = ((this.attr && this.attr.multiple) ? this.name+"[]" : this.name), 
        attr = this.getAttr({
            name: attrName,
            "data-index": this.index
        });

        return this.container(function() {
            let out = '<select'+attr+' autocomplete="off">';
            if(typeof inst.data.items === "object") {
                for(const [value, name] of Object.entries(inst.data.items)) {
                    let selected  = (inst.isChecked(value))  ? ' selected="selected"' : "";
                    out += '<option value="'+value+'"'+selected+'>'+name+'</option>';
                }
            } else {
                console.warn("Object items parameter is missing.");
            }
            out += '</select>';
            return out;
        });
    }

    /**
     * Radio input field
     * @return {string}
     */
    radio() {
        let inst = this, attr = this.getAttr({
            type: "radio",
            name: this.name,
            "data-index": this.index
        });

        return this.container(function() {
            let out = '';
            if(typeof inst.data.items === "object") {
                for(const [value, name] of Object.entries(inst.data.items)) {
                    let checked  = (inst.isChecked(value))  ? ' checked="checked"' : "";
                    out += '<label class="radio item small"><input'+attr+' value="'+value+'"'+checked+'><span class="title">'+name+'</span></label>';
                }
            } else {
                console.warn("Object items parameter is missing.");
            }
            return out;
        });
    }

    /**
     * Checkbox input field
     * @return {string}
     */
    checkbox() {
        let inst = this, length = Object.keys(inst.data.items).length, attr = this.getAttr({
            type: "checkbox",
            name: ((length > 1) ? this.name+"[]" : this.name),
            "data-index": this.index
        });

        return this.container(function() {
            let out = '';
            if(typeof inst.data.items === "object") {
                for(const [value, name] of Object.entries(inst.data.items)) {
                    let checked  = (inst.isChecked(value))  ? ' checked="checked"' : "";
                    out += '<label class="checkbox item small"><input'+attr+' value="'+value+'"'+checked+'><span class="title">'+name+'</span></label>';
                }
            } else {
                console.warn("Object items parameter is missing.");
            }
            return out;
        });
    }

    /**
     * Submit button field
     * @return {string}
     */
    submit(attributes) {
        let inst = this, 

        args = $.extend({
            type: "submit",
            name: this.name,
            value: this.value
        }, attributes),
        attr = this.getAttr(args);

        return '<input'+attr+'>';
    }

    /**
     * Group field(s)
     * @return {string}
     */
    group() {
        let out = '';
        out += '<div class="mb-20 wa-advanced-grouped-field">';
        this.groupFactory(function(o, val) {
            out += o;
        }, true);
        out += '</div>';
        return out;
    }

}