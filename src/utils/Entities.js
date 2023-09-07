/**
 * Entities
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
 */

export class Entities extends String {


    static value(value) {
        return new Entities(value);
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

    htmlspecialchars() {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return this.replace(/[&<>"']/g, match => map[match]);
    }

    xss() {
        return this.htmlspecialchars();
    }

    urlencode() {
        let str = encodeURIComponent(this);
        str.replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
        .replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
        return str;
    }

    urldecode() {
        return decodeURIComponent(this.replace(/\+/g, ' '));
    }

    format() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
    }
}
