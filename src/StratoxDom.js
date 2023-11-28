/**
 * Stratox Dom
 * Author: Daniel Ronkainen
 * Description: At a mere 9 kB (min version), Stratox Dom bridges the gap between the simplicity of jQuery and the modern web development landscape.
 * Copyright: Apache License 2.0
 */
const StratoxFunc = {
    extend: function(a, b) {
        return Object.assign(a, b);

    }, each: function(obj, callback) {
        let i = 0;
        if(obj && (typeof obj === "object")) for(const [key, value] of Object.entries(obj)) {
            let get = callback(key, value, i);
            if(get !== undefined) return get;
            i++;
        }
        return this;

    }, isCollection: function(elem) {
        return (HTMLCollection.prototype.isPrototypeOf(elem) || NodeList.prototype.isPrototypeOf(elem));

    }, isArray: function(item) {
        if(typeof item !== "object") return false;
        return Array.isArray(item);

    }, inArray: function(item, items) {
        if(typeof items !== "object") return false;
        return items.includes(item);

    }, isEmptyObject(obj) {
        return (Object.keys(obj).length === 0);

    }, count: function(arr) {
        return (this.isArray(arr)) ? arr.length : 0;

    }, trim: function(str) {
        return str.trim();

    }, toNum: function(i, float) {
        i = (float) ? parseFloat(i) : parseInt(i);
        return (!Number.isNaN(i)) ? i : 0;

    }, round: function(number, decimalPlaces) {
        if(typeof decimalPlaces !== "number") decimalPlaces = 0;
        let factor = Math.pow(10, decimalPlaces);
        return Math.round(number * factor) / factor;

    }, clone: function(obj) {
        return JSON.parse(JSON.stringify(obj));

    }, ajax: function(settings) {
        let config = {   
            method: 'GET',
            url: "",
            data: null,
            body: null,
            dataType: "json",
            headers: {},
            statusCode: {}
        };
        StratoxFunc.extend(config, settings);
        config.data = (config.data !== null) ? "?"+new URLSearchParams(config.data) : "";
        if(!config.headers.Accept) {
            config.headers.Accept = (config.dataType === "json") ? 'application/json' : 'text/html';
        }
        
        let state = {}, always, fn = fetch(config.url+config.data, config).then(function(response) {
            state = response;
            if(!response.ok) return Promise.reject(response);
            if(config.headers.Accept === 'application/json') return response.json();
            return response.text(); 
        });

        return {
            done: function(data) {
                fn.then(function(response) {
                    if(typeof always === "function") data = always;
                    if(typeof data === "function") data.apply(this, [response, state.status, response]);
                });
                return this;
            },
            fail: function(data) {
                fn.catch(function(response) {
                    if(typeof config.statusCode === "object") {
                        let statusMsg = null;
                        if(typeof config.statusCode[response.status] === "string") {
                            statusMsg = config.statusCode[response.status];
                        } else if(typeof config.statusCode[response.status] === "function") {
                            statusMsg = config.statusCode[response.status].call(this, response);
                        }
                        if(statusMsg !== null && (typeof statusMsg === "string") && !response.message) response.message = statusMsg;
                    }
                    if(typeof always === "function") data = always;
                    if(typeof data === "function") data.apply(this, [response, response.status]);
                });
                return this;
            },
            always: function(data) {
                always = data;
                fn.then(this.done).catch(this.fail);
                return this;
            }
        };
    }

}, StratoxObj = function(elem) {
    StratoxObj.obj = {
        init: function(settings) {
            this.elem = elem;
            this.selector = this._selector();
            this.domStyles = {};
            this.bind = {};
            if(this.selector) this.length = this.selector.length;
            return this;

        }, _selector: function() {

            if(this.elem === null) return null;
            if(typeof this?.elem?.exist === "function" && this.elem.exist()) {
                this.elem = this.elem.get(0);
            }
            if(typeof this.elem === "object" && typeof this.elem.isSelf === "function") {
                return this.elem.selector;
            }

            let selector = this.qrsel(this.elem, document);
            if(selector !== null) return selector;

            if(HTMLCollection.prototype.isPrototypeOf(this.elem) || NodeList.prototype.isPrototypeOf(this.elem)) {
                this.elem = Array.from(this.elem);
                return this.elem;
            }

            return Array(this.elem);

        }, isStratoxDom: function() {
            return true;

        }, qrsel: function(elem, bind, quertSel) {
            if(typeof elem === "string") {
                if(elem.indexOf("<") === 0) {
                    //this.textSelector = elem;
                    this.setTextSelector(elem);
                    return Array(this.createHTML(elem));

                } else {
                    let sp = elem.split(":");
                    if(!quertSel && sp.length === 1 && elem.indexOf("#") === 0) {
                        let binded = bind.getElementById(elem.substring(1));
                        return Array(binded);

                    } else {
                        if(sp.length === 2) {
                            if(sp[1] === "first") sp[1] = "first-child";
                            if(sp[1] === "last") sp[1] = "last-child";

                            if(sp[1] === "input") {
                                let inpEl = bind.elements;
                                if(!inpEl) {
                                    // If bind is e.g. div and not a form then:
                                    inpEl = bind.querySelectorAll("input, select, checkbox, textarea");
                                }
                                return inpEl;
                            }
                        }
                        
                        elem = sp.join(":");
                        return bind.querySelectorAll(elem);
                    }
                }
            }
            return null;

        }, data: function(key, value) {
            let el = this.get();
            if(value === undefined) return el.dataset[key];
            el.dataset[key] = value;
            return this;

        }, removeData: function(key) {
            delete this.get().dataset[key];

        }, exist: function() {
            let el = this.get();
            return (el) ? true : false;

        }, attr: function(key, value) {
            let el = this.get();
            if(value === undefined) {

                if(typeof key === "object") {
                    StratoxFunc.each(key, function(k, v) {
                        el.setAttribute(k, v);
                    });
                    return this;
                }
                return el.getAttribute(key);
            }
            el.setAttribute(key, value);
            return this;

        }, removeAttr: function(key) {
            let el = this.get();
            el.removeAttribute(key);
            return this;

        }, css: function(cssAttr, cssAttr2) {
            let inst = this;
            this.each(function(el) {
                if(typeof cssAttr === "object") {
                    let style = "";                     
                    inst.domElem(el, "waDomStyles", cssAttr);
                    for(const [key, value] of Object.entries(el.waDomStyles)) {
                        style += key+":"+value+";";
                    }
                    el.style.cssText = style;

                } else {
                    inst.domElem(el, "waDomStyles", cssAttr, cssAttr2);
                    el.style[cssAttr] = cssAttr2;
                }
            });

            return this;

        }, hasClass: function(strClass) {
            return this.get().classList.contains(strClass);

        }, addClass: function(addClass) {
            let inst = this;
            this.each(function(el) {
                if(el) {
                    let sp = addClass.split(" ");
                    for(let i = 0; i < sp.length; i++) {
                        let cl = StratoxFunc.trim(sp[i]);
                        inst.domElem(el, "waDomClasses", cl, cl);
                    }

                    let newClass = Object.keys(el.waDomClasses);
                    el.classList.add(...newClass);
                }
            });

            return this;

        }, removeClass: function(addClass) {
            let inst = this;
            this.each(function(el) {
                if(el) {
                    let sp = addClass.split(" "), rm = Array();
                    for(let i = 0; i < sp.length; i++) {
                        let cl = StratoxFunc.trim(sp[i]);
                        rm.push(cl);
                        if(el.waDomClasses && typeof el.waDomClasses[cl] === "string") {
                            delete el.waDomClasses[cl];
                        }
                    }
                    if(rm.length > 0) el.classList.remove(...rm);
                }
            });

            return this;

        }, domElem: function(el, key, merge, merge2) {
            if(typeof el[key] !== "object") el[key] = {};
            if(merge2) {
                el[key][merge] = merge2;
            } else {
                return StratoxFunc.extend(el[key], merge);
            }

        }, hide: function() {
            this.css("display", "none");
            return this;

        }, remove: function() {
            this.each(function(el) {
                if(el) el.remove();
            });
            return this;

        }, children: function() {
            return StratoxDom(this.get(0).parentElement.children);

        }, siblings: function() {
            let el = this.get(0), children = el.parentElement.children, arr = Array();

            el.waCarrot = true;
            StratoxFunc.each(children, function(k, el) {
                if(el.waCarrot !== true) {
                    arr.push(el);
                } else {
                    delete el.waCarrot;
                }    
            });

            this.selector = arr;
            return this;

        }, parent: function() {
            return StratoxDom(this.get(0).parentElement);

        }, first: function() {
            return StratoxDom(this.get(0));

        }, last: function() {
            let l = this.selector.length-1;
            return StratoxDom(this.get(l));

        }, next: function(i) {
            return StratoxDom(this.get(i).nextElementSibling);

        }, prev: function(i) {
            return StratoxDom(this.get(i).previousElementSibling);

        }, eq: function(i) {
            let k = StratoxFunc.toNum(i);
            if(this.selector && this.selector[0] && this.selector[0][0]) {
                return StratoxDom(this.selector[0][i]);
            }
            return StratoxDom(this.selector[i]);

        }, getLength: function() {
            return this.selector.length;

        }, index: function(el) {
            let c = this.get();

            if(!el) {
                return Array.from(c.parentElement.children).indexOf(c);
            }

            if(typeof el === "string") el = $(el).get(0);
            return Array.prototype.indexOf.call(c, el.get(0));

        }, find: function(elem) {
            return StratoxDom(this.qrsel(elem, this.get(0), true));

        }, closest: function(elem) {
            let selector = this.get(0).closest(elem);
            return StratoxDom(selector);

        }, get: function(i) {
            let k = StratoxFunc.toNum(i);
            return (this.selector[k] ?? this.selector);

        }, ready: function(call) {
            this.get(0).addEventListener('DOMContentLoaded', call);
            return this;

        }, each: function(callback) {
            let i = 0, inst = this;
            if(inst.selector) inst.selector.forEach(function(el) {
                if(typeof callback === "function") {
                    //if(el && el[0]) el = el[0]; // DEPRECATED
                    callback.apply(el, [el, inst.selector, i]);
                }
                i++;
            });
            return this;

        }, on: function(...argument) {
            
            const inst = this, [event, ...args] = argument;
            let target, data = {}, callable = function(e) {}, ev = event.split(".");

            StratoxFunc.each(args, function(k, v) {
                if(typeof v === "string") target = v;
                if(typeof v === "object") data = v;
                if(typeof v == "function") callable = function(e) {
                    let newTarget = (target && (typeof e?.target?.closest === "function")) ? e.target.closest(target) : 
                    (((typeof this === "object") && (this !== document)) ? this : e.target);
                    if(newTarget) {
                        if(e.data === undefined) e.data = data;
                        v.apply(newTarget, [e, newTarget]);
                    }
                }
            });

            if(typeof target !== "string" && typeof this.elem === "string") target = this.elem;


            inst.each(function(el) {
                if(el) {
                    el.addEventListener((ev[0] ?? event), callable);
                    el.off = Object.assign( {[event]: {[target]: () => el.removeEventListener((ev[0] ?? event), callable) }}, {} );
                }
            });

            return this;

        }, off: function(event, target) {
            this.each(function(el) {
                if(typeof el?.off === "object" && (!event || el?.off?.[event])) StratoxFunc.each(el.off, function(k1, a) {
                    if(typeof a === "object" && (!target || el?.off?.[event]?.[target])) StratoxFunc.each(a, function(k2, b) {
                        b();
                    });
                });
            });

        }, click: function(call) {
            return this.on("click", call);

        }, trigger: function(eventCall) {
            if(typeof eventCall !== "string") {
                console.error("The trigger argument is expected to be a string.");
                return false;
            }
            return this.each(function(el) {
                if(el) {
                    let theEvent = new Event(eventCall, {
                        bubbles: true, // Event bubbles up through the DOM tree
                        cancelable: true // Event can be canceled
                    });
                    el.dispatchEvent(theEvent);
                }
            });

        }, scroll: function(call) {
            return this.on("scroll", call);

        }, resize: function(call) {
            return this.on("resize", call);

        }, focus: function(call) {
            if(typeof call === "function") return this.on("focus", call);
            this.each(function(el) {
                if(el && el[0]) {
                    el[0].focus();
                } else {
                    if(el) el.focus();
                }
            });
            return this;

        }, blur: function(call) {
            if(typeof call === "function") return this.on("blur", call);
            this.each(function(el) {
                if(el && el[0]) {
                    el[0].blur();
                } else {
                    if(el) el.blur();
                }
            });
            return this;

        }, keydown: function(call) {
            return this.on("keydown", call);

        }, keyup: function(call) {
            return this.on("keydown", call);

        }, scrollTop: function(i) {
            if(i === undefined) return this.get().scrollY;
            let num = StratoxFunc.toNum(i, true);
            this.scrollTo(0, i);
            return i;

        }, scrollTo: function(a, b) {
            a = StratoxFunc.toNum(a, true);
            b = StratoxFunc.toNum(b, true);
            this.get().scrollTo(a, b);
            return this;

        }, width: function() {
            let el = this.get(), a = parseFloat(el.innerWidth), b = parseFloat(el.offsetWidth);
            return !Number.isNaN(a) ? a : (!Number.isNaN(b) ? b : 0);

        }, height: function() {
            let el = this.get(), a = parseFloat(el.innerHeight), b = parseFloat(el.offsetHeight);
            return !Number.isNaN(a) ? a : (!Number.isNaN(b) ? b : 0);

        }, innerWidth: function() {
            return this.width();

        }, innerHeight: function() {
            return this.height();

        }, animate: function(args, speed, callback, easing) {
            let inst = this;
            if(typeof easing !== "string") easing = "cubic-bezier(0.455, 0.030, 0.515, 0.955)";
            speed = StratoxFunc.toNum(speed);
            if(speed > 0) args.transition = "all "+speed+"ms "+easing+"";
            this.css(args);
            if(typeof callback === "function") setTimeout(function(e) {
                if(speed > 0) inst.css("transition", "");
                callback(e);
            }, speed);
            return this;

        }, setTextSelector: function(selector) {
            this.textSelector = selector;
            return this;

        }, createHTML: function(out) {
            var div = document.createElement('div');
            div.innerHTML = StratoxFunc.trim(out);
            return div.firstChild;

        }, append: function(out) {
            let lastEl;
            this.each(function(el) {
                el.insertAdjacentHTML("beforeend", out);
                lastEl = el;
            });
            return StratoxDom(lastEl.lastChild);

        }, prepend: function(out) {
            let lastEl;
            this.each(function(el) {
                el.insertAdjacentHTML("afterbegin", out);
                lastEl = el;
            });
            return StratoxDom(lastEl.firstChild);

        }, appendTo: function(elem) {
            let inst = StratoxDom(elem).append(this.parent().html());
            return inst;
        
        }, prependTo: function(elem) {
            let inst = StratoxDom(elem).prepend(this.parent().html());
            return inst;

        }, before: function(out) {
            let lastEl;
            this.each(function(el) {
                //el.innerHTML += out;
                el.insertAdjacentHTML("beforebegin", out);
                lastEl = el;
            });
            return StratoxDom(lastEl).prev();

        }, after: function(out) {
            let lastEl;
            this.each(function(el) {
                el.insertAdjacentHTML("afterend", out);
                lastEl = el;
            });

            return StratoxDom(lastEl).next();

        }, insertBefore: function(elem) {
            return StratoxDom(elem).before(this.textSelector);

        }, insertAfter: function(elem) {
            return StratoxDom(elem).after(this.textSelector);
            
        }, replaceWith: function(out) {
            let inst = this;
            if(typeof out === "function") {
                let newEl;
                this.each(function(el) {
                    let output = out.apply(inst, [el]);
                    newEl = inst.qrsel(output);
                    newEl = newEl[0];
                    el.replaceWith(newEl);
                });

                return StratoxDom(newEl);

            } else {
                this.each(function(el) {
                    if(el) el.outerHTML = out;
                });
            }
            return inst;

        }, html: function(out) {
            if(this.selector) {
                if(out === undefined) return this.get().innerHTML;
                this.each(function(el) {
                    if(el) this.innerHTML = out;
                });
            }
            return this;

        }, empty: function() {
            this.each(function(el) {
                if(el) el.textContent = "";
            });
            return this;

        }, text: function(out) {
            if(this.selector) { 
                if(out === undefined) return this.get().textContent;
                this.each(function(el) {
                    if(el) el.textContent = out;
                });
            }
            return this;

        }, val: function(value) {

            if(value === undefined) return this.get().value;
            this.each(function(el) {
                el.value = value;                
            });

            return this;

        }
    };

    StratoxObj.obj.init();
    return StratoxObj.obj;
};

export const StratoxDom = StratoxFunc.extend(StratoxObj, StratoxFunc);
