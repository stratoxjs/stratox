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
	let create = stratox.addView("ingress", {
	    headline: "Lorem ipsum dolor",
	    content: "Lorem ipsum dolor sit amet"
	});

	// Add some form fields to ingress field
	stratox.addForm("text", "name", "Name");
	stratox.addForm("text", "email", "Email");





	// Now the ingress, form data and the footer rest in the same view
	stratox.execute(function(observer) {


		$("#add-phone").click(function(e) {
			e.preventDefault();
			stratox.update(stratox.addForm("text", "phone", "Phone"));
		});

		let stratoxFooter = new Stratox("#footer");

		stratoxFooter.addView("footer", {
		    headline: "Please use the email fields!",
		    content: "Is the email address korrekt?"
		});
		
		stratoxFooter.addForm("group", "groupedField", "Group")
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
				stratoxFooter.update("footer", function(data) {
					data.data.headline = inp.val();
				});
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
	stratoxEvent.addView("component", {
	    headline: "Lorem ipsum dolor",
	    content: "Lorem ipsum dolor sit amet"
	});

	stratoxEvent.execute();
});

