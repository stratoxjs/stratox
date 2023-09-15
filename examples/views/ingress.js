
// You can name it to whatever. 
// The important part is that at least one function must be exported

export function ingressComponent(data, container, helper, builder) {
    let inst = this, out = `
	<header class="relative">
		<div class="abs top right pad legend">ingress</div>
	    <h1 class="title">${data.headline}</h1>
	    <p>${data.content.excerpt(55)}</p>
	    ${tags()}
	</header>
	`;

	function tags() {
		let out = "";
		if(helper.isArray(data.tags ?? null)) {
			out += '<div class="tags">';
			helper.each(data.tags, (key, val) => {
				out += '<div class="tag">'+val.toUpper()+'</div>';
		    });
		    out += '</div>';
		}
		return out;
	}

    return out;
}


