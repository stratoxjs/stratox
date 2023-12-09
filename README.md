
# Stratox.js - Template library for building user interfaces

**Stratox.js, an modern, easy to use JavaScript library**, facilitates the development of templates, user interfaces (UI), components and views. Offering a flexible and efficient approach to web development.

Stratox.js weight a mere 6 KB when bundled and minimized, showcasing its lightweight design. Despite its compact size, it rivals major libraries in functionality. This makes Stratox.js an efficient choice for both **applications** and traditional **websites**, ensuring optimal performance and load speeds. Its versatility allows for asynchronous loading of views (with optional caching) or bundling them conveniently in your JS file.

[Jump down to guide](#installation)

### User-Friendly
Stratox is very user-friendly because it lets you prioritize JavaScript and HTML instead of grappling with the complexities of new markup and platform-specific functions, which in the end only lead to the burden of unnecessary abstractions. Stratox harnesses JavaScript's core capabilities, promoting a practical and fundamental approach to modern web development.

### Platform-agnostic nature
Stratox.js doesn't discriminate or judge based on the platform you use, and it works seamlessly on all platforms and depends on nothing but it self.

### Full accessibility support
Moreover, by allowing developers to write regular HTML with the right semantics, Stratox.js ensures that the resulting interfaces are fully **accessible**. This dual emphasis on simplicity and accessibility makes Stratox.js a powerful tool for creating user-friendly and inclusive web applications.

### Why Stratox.js?
-   **High Performance:** Stratox.js is optimized for performance.
-   **Great Load Speed:** Experience swift loading times for a seamless user experience.
-   **Optimized:** A finely-tuned library that prioritizes efficiency.
-   **User-Friendly:** Easy to use, making development a breeze.
-   **Platform-Agnostic:** Works seamlessly across all platforms.
-   **Template Engine:** Facilitates the creation of Views, components, and UI elements.
-   **Form Builder:** Follows HTML semantics, supporting nested form names.
-   **HTML Semantics:** Follow HTML semantics if you wish
-   **Full Accessibility Support:** You can make your app inclusive and accessible for all.
-   **Container Library:** Designed for seamless communication between template views and your project.
- **Async and bundle:** Support asynchronous loading of or bundling of views

### Targeting
-   **Single-Page Application (SPA):** Ideal for creating SPAs with enhanced user experiences.
-   **Cross-Platform Compatibility:** Apache Cordova (PhoneGap), Xamarin, React Native, Electron, Ionic, and similar.
-   **Enhancing Static HTML:** Easily integrates with existing static HTML structures.
-   **Backend Language Integration:** Communicates seamlessly with various backend languages.

## Installation
```
npm i stratox
```
*Or just download the zip and import Stratox.js file*


## Full documentation
The initial documentation draft is ready. (Still recommended to read guide bellow)

#### [Read the documentation](https://wazabii.se/stratoxjs/)

## Getting started
This is just a quick guide to preview how easy it is. Visit the link above for the full documention.

### index.html
Begin by adding an element to the HTML document.
*/examples/index.html*
```html
<div id="ingress"></div>
```

### Initialize 
Start by importing "Stratox.js".
```js
import { Stratox } from './node_modules/stratox/src/Stratox.js';
import { StratoxTemplate } from './node_modules/stratox/src/StratoxTemplate.js'; // (Optional: will add form builder)
```
### Configure 
Add the configuration bellow in you main js file, some where it will globally execute.
```js
Stratox.setConfigs({
    directory: "/absolute/path/to/views/",
    cache: false, // Automatically clear cache if is false on dynamic import
    handlers: {
    	fields: StratoxTemplate, // Optional: will add form builder (se bellow)
    	helper: function() {
    		// Pass on helper classes, functions and objects to your views
    		return {
    			helper1: "Mixed data...",
    			helper2: "Could be classes You want to",
    			helper3: "Pass on to you components",
    		};
    	}
    }
});
```
**directory:**  Directory path for asynchronously or imported templates. Either specify an absolute directory path or if opting for a relative path, **but** keep in mind it starts from the Stratox.js file location meaning if you bundle your files the relative location **will change** to where the bundle file is located at.

**cache:** Automatically clear cache if is false on dynamic import.

**handlers: fields:** Create a custom class handler for creating or modifying form field items, including default fields. The form field handler must extend the "StratoxBuilder" class, which is located in "node_modules/stratox/src/StratoxBuilder.js". You can also create a new class (or copy the StratoxTemplate.js file) and extend your new class to StratoxTemplate if you want to add default fields or StratoxBuilder if you want to start fresh. Then just create your own form fields in your class.

**handlers: helper:** Pass on helper classes, functions and objects to your views. If you are using a DOM traversal enginge then you could pass it on to the helper that in turn passes it on to your components, views and fields


### Template files
First, we need to create a template for use. There are multiple ways to do this, but for this example, I'll demonstrate the most straightforward method. More examples will follow.

To begin, create a template file, such as **/src/views/ingress.js**. The file name will serve as the template identifier **if** it's loaded dynamically/asynchronously, which is the default behavior for templates that utilize separate files without preparing view (pre-importing). 

The asynchronous import is great, especially in the development mode (read more above about it under the directory configuration). As mention above, even after you bundle your JavaScript files the dynamic import will be in affect and if you do not specify otherwise. If you want it to be able to bundle your views/components you can do this with:

#### Load and Prepare the view
```js
// Add import to the top of your js file
import { ingressComponent } from './node_modules/stratox/src/views/ingress.js';
//And then prepare the component...
Stratox.setComponent("ingress", ingressComponent);
```
*Now Stratox will not try to autoload the view/component anymore and it will also be **bundled** with the rest of your files.* 

#### Example template:
```js
// You can name the function whatever. 
// The important part is that at least one function must be exported
export function ingressComponent(data, container, helper, builder) {

	// In this example I am using Javacript Template literals for a clean look.
	// But as this is regular Javacript you can output it as you want.
	
	let out = `
	<header class="relative">
		<h1 class="title">${data.headline}</h1>
		<p>${data.content}</p>
	</header>
	`;
	return out;
}
```
What's fantastic is that you can create your template using plain JavaScript. I've also provided some handy helper functions to simplify your life. For instance, you can utilize the argument "helper" to access to the StratoxDom library, which offers a range of helpful functions.

###  Lets use the template
Once the template is created we only need to use it.
```js
let stratox = new Stratox("#ingress");

let ingress = stratox.view("ingress", {
    headline: "Lorem ipsum dolor",
    content: "Lorem ipsum dolor sit amet",
    tags: ["Tag 1", "Tag 2", "Tag 3"]
});

stratox.execute(function(observer) {
	// Callback...
});

```
That is it... As you can see it is very easy if you know HTML and javascript.


### Update the information
Want to update the templates information? 
```js
ingress.set({ headline: "Headline updated once!" });
stratox.update();

// Or...
stratox.view("ingress", { headline: "Headline updated twize!" });
stratox.update();

// Or...
stratox.update("ingress", function(obj) {
	obj.data.headline = "Headline updated thrice!";
});
```
The text has been updated three time with different techniques. Super easy. More example is coming when docs site is done.

