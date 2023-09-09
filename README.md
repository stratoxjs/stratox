# Stratox.js - Template library for building user interfaces

Stratox.js, an modern JavaScript library, facilitates the development of templates and user interfaces (UI) with a focus on components and views, offering a flexible and efficient approach to web development.

We encourage developers to prioritize JavaScript and HTML, as they should, instead of grappling with the complexities of new markup and platform-specific functions, which in the end only lead to the burden of unnecessary abstractions. Stratox harnesses JavaScript's core capabilities, promoting a practical and fundamental approach to modern web development.

### Platform-agnostic nature
Stratox.js doesn't discriminate or judge based on the platform you use, and it works seamlessly on all platforms and depends on nothing but it self.

## Example

### index.html
Begin by adding an element to the HTML document.
*/examples/index.html*
```html
<div id="ingress"></div>
```

### Configure 
Add the configuration bellow some where it will globally execute
*/examples/App.js*
```js
Stratox.setConfigs({
	xss: "true, // (Default: true) Will auto protect all input data
	directory: "./views/"
});
```

### Template files
First, we need to create a template for use. There are multiple ways to do this, but for this example, I'll demonstrate the most straightforward method. More examples will follow.

To begin, create a template file, such as **"/src/views/ingress.js"**. The file name will serve as the template identifier if it's loaded dynamically/asynchronously, which is the default behavior for templates that utilize separate files without pre importing.

#### Example template:
```js
// You can name the function whatever. 
// The important part is that at least one function must be exported
export function ingressComponent(data, name, stratox, builder, helper) {

	let out = `
	<header class="relative">
		<h1 class="title">${data.headline.toUpperCase()}</h1>
		<p>${data.content}</p>
		${tags()}
	</header>
	`;

	function tags() {
		let out = "";
		if(helper.isArray(data.tags ?? null)) {
			out += '<div class="tags">';
			helper.each(data.tags, (key, val) => {
				out += '<div class="tag">'+val.toUpperCase()+'</div>';
		    });
			out += '</div>';
		}
		return out;
	}
	
	return out;
}
```
By default, the **data** arguments are safeguarded against malicious attacks like XSS. However, you can disable this feature if you're using a backend platform that handles it for you.

What's fantastic is that you can create your template using plain JavaScript. I've also provided some handy helper functions to simplify your life. For instance, you can method-chain your data (e.g., data.headline.trim().toUpperCase()) or utilize the argument "helper" to access to the StratoxDom library, which offers a range of helpful functions.

###  Lets use the template
Once the template is created we only need to use it.
```js
let stratoxIngress = new Stratox("#ingress");

stratoxIngress.view("ingress", {
    headline: "Lorem ipsum dolor",
    content: "Lorem ipsum dolor sit amet",
    tags: ["Tag 1", "Tag 2", "Tag 3"]
});

stratoxIngress.execute(function(observer) {
	// Callback...
});

```
That is it... As you can see it is very easy if you know HTML and javascript.


### Update the information
Want to update the templates information? 
```js

stratoxFooter.view("ingress", { headline: "Headline updated once!" });
stratoxFooter.update();

// Or...

stratoxFooter.update("ingress", function(obj) {
	obj.data.headline = "Headline updated twize!";
});

```
The text has been updated. Super easy. More example is coming when docs site is done.

