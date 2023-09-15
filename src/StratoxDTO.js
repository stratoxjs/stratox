/**
 * Entities
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
 */

export class StratoxDTO {


    constructor(value) {
        this.value = value.toString();
    }

    static value(value) {
        return new StratoxDTO(value);
    }

    /**
     * Magick method
     * @return {string}
     */
    toString() {
        return this.value;
    }

    /**
     * To upper case
     * @return {self}
     */
    toUpper() {
        this.value = this.value.toUpperCase();
        return this;
    }

    /**
     * To lower case
     * @return {self}
     */
    toLower() {
        this.value = this.value.toLowerCase();
        return this;
    }

    /**
     * Upper case first cahracter
     * @return {self}
     */
    ucfirst() {
        this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
        return this;
    }

    /**
     * Strip all tags
     * @return {self}
     */
    stripTags() {
        this.value = this.value.replace(/<[^>]*>/g, '');
        return this;
    }

    /**
     * Excerpt
     * @param  {int} length max length
     * @return {self}
     */
    excerpt(length) {
        if(typeof length !== "number") length = 30;
        if (length < this.value.length) {
            this.stripTags();
            this.value = this.value.substr(0, length).trim() + '...';
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
        this.value = this.value.replace(/[&<>"']/g, match => map[match]);
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
        let str = encodeURIComponent(this.value);
        str.replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
        .replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');

        this.value = str;
        return this;
    }

    /**
     * Url decode
     * @return {self}
     */
    urldecode() {
        this.value = decodeURIComponent(this.value.replace(/\+/g, ' '));
        return this;
    }

    /**
     * [sprint description]
     * @param  {string|number} arguments  Spread of arguments (string number)
     * @return {self}
     */
    sprint() {
        var args = arguments;
        this.value = this.value.replace(/{(\d+)}/g, function(match, number) {
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
        return this;
    }


    /**
     * Access String
     */
    String() {
        return String(this.value);
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
