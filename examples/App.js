import { StratoxDom as $ } from '../src/StratoxDom.js';
import { Stratox } from '../src/Stratox.js';
import { Create } from '../src/utils/Create.js';

// This example took me 20 minutes to write!
// Thats how powerfull this template systems is!

$(document).ready(function() {

	// src/views
	Stratox.setConfigs({
	    directory: "./views/"
	});

	let stratox = new Stratox("#ingress");


	// Will return a Create instance of Stratox 
	// src/views/ingress.js
	let create = stratox.view("ingress", {
	    headline: "Lorem ipsum dolor",
	    content: "Lorem ipsum dolor sit amet",
	    tags: ["Tag 1", "Tag 2", "Tag 3"]
	});

	// Add some form fields to ingress field
	stratox.form("name").setLabel("Name");
	stratox.form("email").setLabel("Email");
	

	// Now the ingress, form data and the footer rest in the same view
	stratox.execute(function(observer) {

		let stratoxFooter = new Stratox("#footer");

		stratoxFooter.view("footer", {
		    headline: "Please use the email fields!",
		    content: "Is the email address korrekt?"
		});
		
		stratoxFooter.form("customField", { type: "group" })
		.setFields({
			ingress: {
				type: "ingress",
				data: {
				    headline: "Custom fields",
				    content: "You can dynamically add more fields"
				}
			},
			title: {
				type: "text",
				label: "Title"
			},
			description: {
				type: "textarea",
				label: "Description"
			}
		})
		.setConfig({
			nestedNames: true,
			controls: true
		});

		stratoxFooter.execute();

		$(document).on("input", function(e) {
			let inp = $(e.target), name = inp.attr("name");
			if(name === "email") {
				stratoxFooter.view("footer", { headline: inp.val() });
				stratoxFooter.update();
			}
		});
		

	});

	// ADD FOOTER
	// Create a static view
	Stratox.prepareView("footer", function(data, name) {
		let out = `
		<footer class="relative">
			<div class="abs top right pad legend">${name}</div>
		    <h1 class="title">${data.headline}</h1>
		    <p>${data.content}</p>
		</footer>
		`;
		return out;
	});

	let stratoxEvent = new Stratox();
	stratoxEvent.view("component", {
	    headline: "Lorem ipsum dolor",
	    content: "Lorem ipsum dolor sit amet"
	});

	stratoxEvent.execute();

});
