

export function formComponent(data, inst) {
	let out = '';

	out += '<form id="component-'+inst.name+'" data-action="'+(data.action ?? "")+'" data-method="'+(data.method ?? "post")+'">';
	inst.groupFactory(function(o, val) {
        out += o;
    });
    
    out += '<input type="submit" value="Submit">';
	out += '</form>';
	return out;
}

