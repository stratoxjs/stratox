
# Stratox.js: The Progressive Framework for Dynamic UI and Modern Web Applications ![npm](https://img.shields.io/npm/v/stratox)

![enter image description here](http://wazabii.se/github-assets/installation-prompt-1.png)

Stratox.js is a powerful JavaScript library for modern web development, enabling you to build SPAs, full-scale applications, or enrich static HTML with dynamic components. With its flexible framework and template library, Stratox.js adapts to your needs seamlessly.

Built for exceptional performance and responsiveness without external dependencies, Stratox.js features a UI engine and form builder that align with HTML semantics for simplicity and accessibility. Designed for ease of use, it makes application development effortless.

## The Library or Framework? 
Are you looking for the Stratox Library or the Stratox Framework? Stratox is available as both a library and a framework, catering to different development needs.

### Startox: Framework
Stratox also comes as a fully-featured framework, offering a comprehensive solution for building modern, dynamic applications from the ground up. The framework simplifies complex tasks with built-in tools and structured workflows, making it ideal for creating full-fledged web apps with minimal setup. If you’re seeking a robust foundation to kickstart your project, the Stratox Framework is your go-to choice.

[Stratox Framework documentation](https://stratox.wazabii.se)

### Startox: Library
The library version provides a lightweight, flexible tool that integrates seamlessly with your existing scripts, giving you full control over implementation. It’s an excellent choice for enhancing static websites with dynamic content, allowing you to add interactivity without overhauling your entire setup.

[Stratox Library documentation](https://stratox.wazabii.se/stratox.js)

## Example
Below is a just **basic** example to demonstrate how easy it is to build a component. 
```js
export default function MyTextComponent({ props }) {
    return `
    <header>
        <h1>${props.headline}</h1>
        <p>${props.content}</p>
    </header>
    `;
}
```
### Resulting in

![enter image description here](https://wazabii.se/github-assets/example-result-about.png)
