


# Stratox.js - template engine

**Stratox.js is a user-friendly JavaScript template engine that helps you easily build template components and views.**

The Stratox template library is created using up-to-date methods, keeping its size at around 6 kb when bundled and minimized (gzipped). It works independently, smoothly running on all platforms without needing anything else. Stratox.js is a smart pick for applications and websites, ensuring great performance and quick load time. It's versatile, letting you load views asynchronously (with optional caching) or bundle them conveniently into your main JavaScript file.

## Documentation
**[You can find the full Startox documentation here](https://stratox.wazabii.se/)**

#### The documentation is divided into several sections:
* [Why Stratox.js?](https://stratox.wazabii.se/)
* [Installation](https://stratox.wazabii.se/installation)
* [Basic example](https://stratox.wazabii.se/template-engine/basic-example)
* [Show template view](https://stratox.wazabii.se/template-engine/show-templates)
* [Create template view](https://stratox.wazabii.se/template-engine/create-templates)
* [Update template view](https://stratox.wazabii.se/template-engine/updating-views)
* [Install plugins](https://stratox.wazabii.se/template-engine/plugins)
* [Form builder](https://stratox.wazabii.se/form-builder/form-builder)
* [Custom form template](https://stratox.wazabii.se/form-builder/custom-form-template)
* [Container](https://stratox.wazabii.se/advanced-features/container)
* [Template view functions](https://stratox.wazabii.se/advanced-features/template-view-functions)

## Why Startox

### User-Friendly
Stratox is very user-friendly because it lets you prioritize JavaScript and HTML instead of grappling with the complexities of new markup and platform-specific functions, which in the end only lead to the burden of unnecessary abstractions. Stratox harnesses JavaScript's core capabilities, promoting a practical and fundamental approach to modern web development.

### Platform-agnostic nature
Stratox.js doesn't discriminate or judge based on the platform you use, and it works seamlessly on all platforms and depends on nothing but it self.

### Full accessibility support
Moreover, by allowing developers to write regular HTML with the right semantics, Stratox.js ensures that the resulting interfaces are fully **accessible**. This dual emphasis on simplicity and accessibility makes Stratox.js a powerful tool for creating user-friendly and inclusive web applications.

### Why Stratox.js?
- **High Performance:** Stratox.js is optimized for performance.
- **Great Load Speed:** Experience swift loading times for a seamless user experience.
- **Optimized:** A finely-tuned library that prioritizes efficiency.
- **User-Friendly:** Easy to use, making development a breeze.
- **Platform-Agnostic:** Works seamlessly across all platforms.
- **Template Engine:** Facilitates the creation of Views, components, and UI elements.
- **Form Builder:** Follows HTML semantics, supporting nested form names.
- **HTML Semantics:** Follow HTML semantics if you wish
- **Full Accessibility Support:** You can make your app inclusive and accessible for all.
- **Container Library:** Designed for seamless communication between template views and your project.
- **Async and bundle:** Support asynchronous loading of or bundling of views

### Targeting
- **Single-Page Application (SPA):** Ideal for creating SPAs with enhanced user experiences.
- **Cross-Platform Compatibility:** Apache Cordova (PhoneGap), Xamarin, Electron, Ionic, and similar.
- **Enhancing Static HTML:** Easily integrates with existing static HTML structures.
- **Backend Language Integration:** Easily integrates with various backend languages.

## Example
Below is a just **basic** example to demonstrate how easy it is to build a template view/component. There are a lot more examples in the [documentation](https://stratox.wazabii.se/).
```php
Stratox.setComponent("ingress", function(data, container, helper, builder) {
    let out = `
    <header class="mb-50 align-center">
        <h1>${data.headline}</h1>
        <p>${data.content}</p>
    </header>
    `;
    return out;
});

const stratox = new Stratox("#app");

stratox.view("ingress", {
  headline: "Lorem ipsum dolor",
  content: "Lorem ipsum dolor sit amet"
});

stratox.execute();
```
*[Click here to see the result](https://codepen.io/wazabii8/pen/bGZgPNo)*
