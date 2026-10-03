/**
 * Stratox html
 * Author: Daniel Ronkainen
 * Description: Escaping for component output (D-030). The tagged template html`...` escapes every
 *              value it interpolates; raw() marks trusted markup; escape() escapes one value.
 * Copyright: Apache License 2.0
 */

// Attributes whose value is a URL, when an interpolation starts their value
const URL_ATTRIBUTE = /\b(?:href|src|action|formaction|xlink:href)\s*=\s*["']?$/i;

// URL schemes that run script
const SCRIPT_URL = /^(?:javascript|vbscript):/i;

const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Markup that is inserted as it is: the result of html`...`, raw(), partials and blocks
 */
export class SafeHtml {
  #markup;

  constructor(markup) {
    this.#markup = String(markup);
  }

  toString() {
    return this.#markup;
  }
}

/**
 * Escape a value for HTML text or a quoted attribute: & < > " '
 * @param  {mixed} value
 * @return {string}
 */
export function escape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ENTITIES[character]);
}

/**
 * Mark trusted markup, so it is inserted without escaping. The one opt-out: search for raw( to find them all.
 * @param  {mixed} markup
 * @return {SafeHtml}
 */
export function raw(markup) {
  return (markup instanceof SafeHtml) ? markup : new SafeHtml(markup ?? '');
}

/**
 * Turn an interpolated value into HTML: markup as it is, lists joined, nothing for null, undefined
 * and false, and everything else escaped.
 * @param  {mixed} value
 * @return {string}
 */
function toHtml(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.toString();
  if (Array.isArray(value)) return value.map(toHtml).join('');
  return escape(value);
}

/**
 * Does this text, put into a URL attribute, run script? Browsers ignore whitespace and control
 * characters in the scheme, so they are ignored here too.
 * @param  {string} text
 * @return {boolean}
 */
function isScriptUrl(text) {
  // eslint-disable-next-line no-control-regex
  return SCRIPT_URL.test(text.replace(/[\u0000- ]/g, ''));
}

/**
 * The tagged template for component markup: html`<h2>${props.title}</h2>`
 * Every value is escaped, except SafeHtml (html results, raw(), partials, blocks). A javascript: or
 * vbscript: URL in href, src, action, formaction or xlink:href gets the prefix "unsafe:" (D-030, X-3).
 * @param  {string[]} strings
 * @param  {...mixed} values
 * @return {SafeHtml}
 */
export function html(strings, ...values) {
  let markup = strings[0];
  values.forEach((value, index) => {
    let text = toHtml(value);
    if (!(value instanceof SafeHtml) && URL_ATTRIBUTE.test(markup) && isScriptUrl(text)) {
      text = `unsafe:${text}`;
    }
    markup += text + strings[index + 1];
  });
  return new SafeHtml(markup);
}
