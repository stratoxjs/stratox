

export function component(data, container, $, builder) {

    let inst = this, obj = $("#events"), 
    out = `
    <section id="event-holder" class="holder relative">
    	<div class="abs top right pad legend">Component</div>
        <h1 class="title">${data.headline}</h1>
        <p>${data.content}</p>
        <p><a class="btn" href="#">Click me</a></p>
    </section>
    `;

    obj.html(out);
    obj.removeClass("hide");

    $("#event-holder").on("click", ".btn", function(e) {
    	e.preventDefault();
    	if(!inst.count) inst.count = 1;
    	inst.update("component", function(obj) {
            obj.data.headline = "Updated "+inst.count+" time";
        });
    	inst.count++;
    });

}

