/**
 * Entities
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
 */

export class StratoxDTO {

    #value = "";
    #raw;

    constructor(value) {
        this.#value = value.toString();
        this.#raw = this.#value;
    }

    static value(value) {
        return new StratoxDTO(value);
    }

    /**
     * Get value
     * @return {string}
     */
    get() {
        return this.#value.toString();
    }

    /**
     * Get raw and unprotected value
     * It is not wrong to use this method But:
     * This could be used if you want to pass HTML code in object BUT be carefull if handling HTTP Request
     * @return {string}
     */
    getRaw() {
        return this.#raw;
    }

    /**
     * Create new instance to tranverse but with raw and unprotected value
     * It is not wrong to use this method But:
     * This could be used if you want to pass HTML code in object BUT be carefull if handling HTTP Request
     * @return {self} [description]
     */
    withRaw() {
        return new StratoxDTO(this.#raw);
    }

    /**
     * Magick method
     * @return {string}
     */
    toString() {
        return this.#value;
    }

    /**
     * To upper case
     * @return {self}
     */
    toUpper() {
        this.#value = this.#value.toUpperCase();
        return this;
    }

    /**
     * To lower case
     * @return {self}
     */
    toLower() {
        this.#value = this.#value.toLowerCase();
        return this;
    }

    /**
     * Upper case first cahracter
     * @return {self}
     */
    ucfirst() {
        this.#value = this.#value.charAt(0).toUpperCase() + this.#value.slice(1);
        return this;
    }

    /**
     * Strip all tags
     * @return {self}
     */
    stripTags() {
        this.#value = this.#value.replace(/<[^>]*>/g, '');
        return this;
    }

    /**
     * Trim string
     * @return {self}
     */
    trim() {
        this.#value.trim();
        return this;
    }

    /**
     * Excerpt
     * @param  {int} length max length
     * @return {self}
     */
    excerpt(length) {
        if(typeof length !== "number") length = 30;
        if (length < this.#value.length) {
            this.stripTags();
            this.#value = this.#value.substr(0, length).trim() + '...';
        }
        return this;
    }

    /**
     * Escape special cahracters
     * @return {self}
     */
    htmlspecialchars() {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        this.#value = this.#value.replace(/[&<>"']/g, match => map[match]);
        return this;
    }

    /**
     * Escape special cahracters
     * @return {self}
     */
    protect() {
        this.htmlspecialchars();
        return this;
    }

    /**
     * Escape special cahracters
     * @return {self}
     */
    xss() {
        this.htmlspecialchars();
        return this;
    }

    /**
     * Url encode
     * @return {self}
     */
    urlencode() {
        let str = encodeURIComponent(this.#value);
        str.replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
        .replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');

        this.#value = str;
        return this;
    }

    /**
     * Url decode
     * @return {self}
     */
    urldecode() {
        this.#value = decodeURIComponent(this.#value.replace(/\+/g, ' '));
        return this;
    }

    /**
     * [sprint description]
     * @param  {string|number} arguments  Spread of arguments (string number)
     * @return {self}
     */
    sprint() {
        var args = arguments;
        this.#value = this.#value.replace(/{(\d+)}/g, function(match, number) {
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
        return this;
    }


    /**
     * Access String
     */
    String() {
        return String(this.#value);
    }
    
    /*
    padStart(targetLength, padString) {

        targetLength = targetLength>>0; //truncate if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));

        if(this.length > targetLength) {
            return String(this);

        } else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length);
            }
            return padString.slice(0,targetLength) + String(this);
        }
    }
     */
}
