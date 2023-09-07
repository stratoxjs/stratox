
// You can name it to whatever. 
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