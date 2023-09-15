/**
 * Entities
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
 */

export class Entities {


    constructor(value) {
        this.value = value.toString();
    }

    static value(value) {
        return new Entities(value);
    }


    /**
     * Magick method
     * @return {string}
     */
    toString() {
        return this.value;
    }

    String() {
        return String(this.value);
    }


    toUpper() {
        this.value = String(this.value).toUpperCase();
        return this;
    }

    toLower() {
        this.value = String(this.value).toLowerCase();
        return this;
    }

    stripTags() {
        this.value = this.value.replace(/<[^>]*>/g, '');
        return this;
    }

    excerpt(length) {
        if(typeof length !== "number") length = 30;
        if (length < this.value.length) {
            this.stripTags();
            this.value = this.value.substr(0, length).trim() + '...';
        }
        return this;
    }


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

    protect() {
        this.htmlspecialchars();
        return this;
    }

    xss() {
        this.htmlspecialchars();
        return this;
    }

    urlencode() {
        let str = encodeURIComponent(this.value);
        str.replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
        .replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');

        this.value = str;
        return this;
    }

    urldecode() {
        this.value = decodeURIComponent(this.value.replace(/\+/g, ' '));
        return this;
    }

    
    /*
    format() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
    }

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
