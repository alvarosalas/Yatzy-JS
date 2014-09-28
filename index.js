/*global console: false, require: false, module: false, exports: false */
var express = require("express"),
	app = express(),
	list = [{
		name: "Isak",
		score: 1
	}];

app.use(express.json());
app.use(express.static(__dirname));

var allowCrossDomain = function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (req.method === "OPTIONS") {
		res.send(200);
	} else {
		next();
	}
};

app.post("/", function(req, res) {
	"use strict";
	console.log(req.body);
	createListItems(req.body.names, req.body.score);
	res.send(201);
});

app.get("/", function(req, res) {
	"use strict";
	res.sendfile(__dirname + "/index.html");
});

app.get("/highscores", function(req, res) {
	"use strict";
	var html = "",
		i;

	html += "<!DOCTYPE html>";
	html += "<head>";
	html += "<title>Yatzy Highscores</title>";
	html += "<link rel='stylesheet' href='//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css'>"
	html += "</head>";
	html += "<body>";
	html += "<div class='panel panel-info container'>";
	html += "<div class='panel-heading'><h1>Yatzy Highscores</h1></div>";
	html += "<div class='panel-body'>";

	html += "<div class='list-group'>";

	for (i = 0; i < list.length; i = i + 1) {
		var labelColor = "black",
			header = "h" + (i + 1 > 3 ? 6 : 3);

		switch (i + 1) {
			case 1:
				labelColor = "#FFD700";
				break;
			case 2:
				labelColor = "#C0C0C0";
				break;
			case 3:
				labelColor = "#CD7F32";
		}
		html += "<li class='list-group-item'><" + header + ">" + list[i].name + "<span class='label pull-right' style='background-color: " + labelColor + "'>" + list[i].score + "</span><" + header + "/></li>";
	}

	html += "</div>";
	html += "</div>";
	html += "</div>";
	html += "</body>";
	html += "</html>";

	res.send(200, html);
});

// Change port to the one on highscores.deluxdesigns.se
app.listen(8000);
console.log("Server is running on port 8000");

// Functions below are used to store 5 top highscores in a list

function createListItems(names, score) {
	"use strict";
	var listItem,
		i;
	for (i = 0; i < names.length; i = i + 1) {
		listItem = {};
		listItem.name = names[i];
		listItem.score = score;
		addToList(listItem);
	}
}

function addToList(listItem) {
	"use strict";
	var i;

	if (list.length === 0) {
		list.push(listItem);
	} else {
		for (i = 0; i < list.length; i = i + 1) {
			if (listItem.score > list[i].score) {
				list.splice(i, 0, listItem);
				break;
			}
			if (i === list.length - 1) {
				list.push(listItem);
				break;
			}
		}
	}

	if (list.length > 5) {
		list.pop();
	}
}

function getList() {
	"use strict";
	return list;
}