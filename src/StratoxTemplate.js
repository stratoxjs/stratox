/**
 * Stratox template
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import { StratoxBuilder } from './StratoxBuilder.js';

export class StratoxTemplate extends StratoxBuilder {
    
    /**
     * Create a container for you form item 
     * @param  {callable} call return form item inside the callable
     * @return {string}
     */
    container(call) {
        let reqSymbol = "", out = "", attrClass = " w-full";
        if((this.getValidation("length", 0) > 0) || (this.getValidation("hasLength", 1) > 0)) {
            reqSymbol = "*";
        }
        
        if(typeof this.conAttr?.class === "string") {
            attrClass = " "+this.conAttr.class;
        }
        this.conAttr.class = 'mb-15 field-'+this.nameJoin+attrClass;

        const conAttr = this.getAttrStr(this.conAttr);
        out = '<div id="'+this.getFieldID()+'" data-index="'+this.index+'"'+conAttr+'>';
        if(this.label) out += '<label>'+this.label+reqSymbol+'<div class="message hide"></div></label>';
        if(this.description) out += '<div class="description legend">'+this.description+'</div>';
        out += call();
        out += '</div>';
        return out;
    }

    /**
     * Single input field (without container)
     * @param  {object} attributes Add attr to input tag
     * @return {string}
     */
    input(helper, attributes) {
        if(typeof attributes !== "object") attributes = {};

        // Default
        let out = "", 
        args = Object.assign({
            type: "text",
            name: this.name,
            value: this.value,
            "data-index": this.index
        }, attributes),
        type = (typeof this.attr.type === "string" ? this.attr.type : null), 
        attr = this.getAttr(args);

        if(type === "password") {
            out += '<div class="relative">';
            out += '<a class="abs right block middle over-1 pad wa-show-password-btn" href="#"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="17" cy="15" r="1"/><circle cx="16" cy="16" r="6"/><path d="M2 16S7 6 16 6s14 10 14 10-5 10-14 10S2 16 2 16Z"/></svg></a>';
        }
        out += '<input'+attr+'>';
        if(type === "password") {
            out += '</div>';
        }

        return out;
    }

    /**
     * Regular input field
     * @return {string}
     */
    text(helper) {
        let inst = this;
        return this.container(() => inst.input());
    }

    /**
     * Password input field
     * @return {string}
     */
    password(helper) {
        let inst = this;
        return this.container(() => inst.input(helper, { type: "password" }));
    }

    /**
     * Date input field
     * @return {string}
     */
    date(helper) {
        let inst = this;
        return this.container(() => inst.input(helper, { type: "date" }));
    }

    /**
     * Date time input field
     * @return {string}
     */
    datetime(helper) {
        let inst = this;
        return this.container(() => inst.input(helper, { type: "datetime-local" }));
    }

    /**
     * Hidden input field
     * @return {string}
     */
    hidden(helper) {
        let inst = this;
        return inst.input(helper, { type: "hidden" });
    }

    /**
     * Textarea field
     * @return {string}
     */
    textarea(helper) {
        let inst = this, attr = this.getAttr({
            name: this.name,
            "data-index": this.index
        });
        
        return this.container(() => {
            return '<textarea'+attr+'>'+inst.value+'</textarea>';
        }); 
    }
    
    /**
     * Select field
     * @return {string}
     */
    select(helper) {
        let inst = this, attrName = ((this.attr && this.attr.multiple) ? this.name+"[]" : this.name), 
        attr = this.getAttr({
            name: attrName,
            "data-index": this.index
        });

        return this.container(() => {
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
    radio(helper) {
        let inst = this, attr = this.getAttr({
            type: "radio",
            name: this.name,
            "data-index": this.index
        });

        return this.container(() => {
            let out = '';
            if(typeof inst.data.items === "object") {
                for(const [value, name] of Object.entries(inst.data.items)) {
                    let checked  = (inst.isChecked(value))  ? ' checked="checked"' : "";
                    out += '<label class="radio items small"><input'+attr+' value="'+value+'"'+checked+'><span class="title">'+name+'</span></label>';
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
    checkbox(helper) {
        let inst = this, length = Object.keys(inst.data.items).length, attr = this.getAttr({
            type: "checkbox",
            name: ((length > 1) ? this.name+"[]" : this.name),
            "data-index": this.index
        });
        
        return this.container(() => {
            let out = '';
            if(typeof inst.data.items === "object") {
                for(const [value, name] of Object.entries(inst.data.items)) {
                    let checked  = (inst.isChecked(value))  ? ' checked="checked"' : "";
                    out += '<label class="checkbox items small"><input'+attr+' value="'+value+'"'+checked+'><span class="title">'+name+'</span></label>';
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
    submit(helper) {
        let attributes = {};
        let inst = this, 
        args = Object.assign({
            type: "submit",
            class: "button bg-primary",
            name: this.name,
            value: this.value
        }, attributes),
        attr = this.getAttr(args);
        return '<div class="submit grow flex justify-end"><input'+attr+'></div>';
    }

    /**
     * Group field(s)
     * @TailwindClasses relative card-3 mb-15 rounded border border-primary inline-block pad absolute z-10
     * @TailwindClasses top-0 bottom-0 right-0 left-1/2 -translate-x-2/4 translate-y-2/4 -translate-y-2/4
     * @return {string}
     */
    group() {
        const inst = this;
        return this.container(() => {
            let out = '';
            out += '<div id="'+inst.getFieldID()+'" class="mb-20 wa-advanced-grouped-field">';
            inst.groupFactory((o, val) => {
                out += o;
            }, true);
            out += '</div>';
            return out;
        });
    }

}