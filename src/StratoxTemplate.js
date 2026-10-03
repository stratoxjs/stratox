/**
 * Stratox template
 * Author: Daniel Ronkainen
 * Description: A modern JavaScript template library that redefines how developers
 *              can effortlessly create dynamic views.
 * Copyright: Apache License 2.0
 */

import StratoxBuilder from './StratoxBuilder.js';

export default class StratoxTemplate extends StratoxBuilder {
  /**
     * Create a container for you form item
     * @param  {callable} call return form item inside the callable
     * @return {string}
     */
  container(call) {
    let reqSymbol = '';
    let out = '';
    let attrClass = ' w-full';
    if ((this.getValidation('length', 0) > 0) || (this.getValidation('hasLength', 1) > 0)) {
      reqSymbol = '*';
    }

    if (typeof this.conAttr?.class === 'string') {
      attrClass = ` ${this.conAttr.class}`;
    }
    this.conAttr.class = `mb-15 field-${this.nameJoin}${attrClass}`;

    // conAttr.id replaces the generated id instead of adding a second one (audit F30)
    const { id = this.getFieldID(), ...otherAttr } = this.conAttr;
    const conAttr = this.getAttrStr(otherAttr);
    // A form without a root element marks its fields, so its events can tell them apart (audit F42)
    const marker = this.formMarker ? ` data-stratox="${this.formMarker}"` : '';
    out = `<div id="${this.escapeHtml(id)}" data-index="${this.index}"${marker}${conAttr}>`;
    if (this.label) out += `<label>${this.label}${reqSymbol}<div class="message hide"></div></label>`;
    if (this.description) out += `<div class="description legend">${this.description}</div>`;
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
    let newAttr = attributes;
    if (typeof newAttr !== 'object') newAttr = {};

    // Default
    const args = {
      type: 'text',
      name: this.name,
      value: this.value,
      'data-index': this.index,
      ...newAttr,
    };
    // The show-password button that attr.type "password" used to add had no script; removed (audit F28, D-029)
    return `<input${this.getAttr(args)}>`;
  }

  /**
     * Regular input field
     * @return {string}
     */
  text(helper) {
    const inst = this;
    return this.container(() => inst.input());
  }

  /**
     * Password input field
     * @return {string}
     */
  password(helper) {
    const inst = this;
    return this.container(() => inst.input(helper, { type: 'password' }));
  }

  /**
     * Date input field
     * @return {string}
     */
  date(helper) {
    const inst = this;
    return this.container(() => inst.input(helper, { type: 'date' }));
  }

  /**
     * Date time input field
     * @return {string}
     */
  datetime(helper) {
    const inst = this;
    return this.container(() => inst.input(helper, { type: 'datetime-local' }));
  }

  /**
     * Hidden input field
     * @return {string}
     */
  hidden(helper) {
    const inst = this;
    return inst.input(helper, { type: 'hidden' });
  }

  /**
     * Textarea field
     * @return {string}
     */
  textarea(helper) {
    const inst = this; const
      attr = this.getAttr({
        name: this.name,
        'data-index': this.index,
      });

    return this.container(() => `<textarea${attr}>${inst.escapeHtml(inst.value)}</textarea>`);
  }

  /**
     * Select field
     * @return {string}
     */
  select(helper) {
    const inst = this; const attrName = ((this.attr && this.attr.multiple) ? `${this.name}[]` : this.name);
    const attr = this.getAttr({
      name: attrName,
      'data-index': this.index,
    });

    return this.container(() => {
      let out = `<select${attr} autocomplete="off">`;
      if (typeof inst.data.items === 'object') {
        Object.entries(inst.data.items).forEach(([value, name]) => {
          const selected = (inst.isChecked(value)) ? ' selected="selected"' : '';
          out += `<option value="${inst.escapeHtml(value)}"${selected}>${name}</option>`;
        });
      } else {
        console.warn('Object items parameter is missing.');
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
    const inst = this; const
      attr = this.getAttr({
        type: 'radio',
        name: this.name,
        'data-index': this.index,
      });

    return this.container(() => {
      let out = '';
      if (typeof inst.data.items === 'object') {
        Object.entries(inst.data.items).forEach(([value, name]) => {
          const checked = (inst.isChecked(value)) ? ' checked="checked"' : '';
          out += `<label class="radio items small"><input${attr} value="${inst.escapeHtml(value)}"${checked}><span class="title">${name}</span></label>`;
        });
      } else {
        console.warn('Object items parameter is missing.');
      }
      return out;
    });
  }

  /**
     * Checkbox input field
     * @return {string}
     */
  checkbox(helper) {
    const inst = this;
    // Without items the field warns like select and radio instead of throwing (audit F14)
    const { items } = inst.data;
    const hasItems = (typeof items === 'object' && items !== null);
    const length = hasItems ? Object.keys(items).length : 0;
    const attr = this.getAttr({
      type: 'checkbox',
      name: ((length > 1) ? `${this.name}[]` : this.name),
      'data-index': this.index,
    });

    return this.container(() => {
      let out = '';
      if (hasItems) {
        Object.entries(items).forEach(([value, name]) => {
          const checked = (inst.isChecked(value)) ? ' checked="checked"' : '';
          out += `<label class="checkbox items small"><input${attr} value="${inst.escapeHtml(value)}"${checked}><span class="title">${name}</span></label>`;
        });
      } else {
        console.warn('Object items parameter is missing.');
      }
      return out;
    });
  }

  /**
     * Submit button field
     * @return {string}
     */
  submit(helper) {
    const attributes = {};
    const inst = this;
    const args = {
      type: 'submit',
      class: 'button bg-primary',
      name: this.name,
      value: this.value,
      ...attributes,
    };
    const attr = this.getAttr(args);
    return `<div class="submit grow flex justify-end"><input${attr}></div>`;
  }

  /**
     * Group field(s)
     * @TailwindClasses relative card-3 mb-15 rounded border border-primary inline-block pad
     * @TailwindClasses absolute z-10 top-0 bottom-0 right-0 left-1/2
     * @TailwindClasses -translate-x-2/4 translate-y-2/4 -translate-y-2/4
     * @return {string}
     */
  group() {
    const inst = this;
    return this.container(() => {
      let out = '';
      // The wrapper and the rows get ids of their own, not the group's (audit F35)
      out += `<div id="${inst.getFieldID()}-group" class="mb-20 wa-advanced-grouped-field">`;
      inst.index++;
      inst.groupFactory((o, val) => {
        out += o;
      }, true);
      out += '</div>';
      return out;
    });
  }
}
