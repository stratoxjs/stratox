
# Stratox
Stratox.js, a modern JavaScript template library that redefines how developers can effortlessly create dynamic views.

Over the past few years, JavaScript has grown into an incredibly powerful language, able to stand proudly on its own merits. Thanks to the advent of modern JavaScript features, the task of organizing and modularizing your codebase has become more straightforward than ever before and still this is just the beginning.

The outcome? An ecosystem where JavaScript thrives, liberated from the weight of needless abstractions.

Our primary aim is to empower developers becoming better at JavaScript, all while efficiently crafting dynamic views. By harnessing the inherent capabilities of JavaScript  our library presents a fresh perspective on modern web development.

One of the great things about Stratox.js is its platform-agnostic nature. It doesn't discriminate or judge based on the platform you use, and it works seamlessly on all platforms and depends on nothing but it self!


## Example

### index.html
Start by adding a element to the html document
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
You can start by creating a template file. The file name will become the template name/identifier IF it is loaded dynamically more about this later.
*/src/views/ingress.js*
```js
// You can name the function whatever. 
// The important part is that at least one function must be exported
export function ingressComponent(data, inst) {
    let out = `
    <header class="relative">
    	<div class="abs top right pad legend">ingress</div>
        <h1 class="title">${data.headline}</h1>
        <p>${data.content}</p>
    </header>
    `;
    return out;
}
```
###  Add data to the ingress
Now lets add some data to the ingress and paint the view. 
```js
let stratoxIngress = new Stratox("#ingress");

stratoxIngress.addView("ingress", {
    headline: "Lorem ipsum dolor",
    content: "Lorem ipsum dolor sit amet"
});

stratoxIngress.execute(function(observer) {
	// Callback...
});

```
That is it. As you can see it is super user friendly.


### Update the ingress
Want to update the ingress? Then execute the command bellow.
```js
stratoxFooter.update("footer", function(obj) {
	obj.data.headline = "Headline updated!";
});
```
Done... the text has been updated. Super easy. Take a look at the examples here for some greate examples.

