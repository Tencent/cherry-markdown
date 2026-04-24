var map = require("map-stream"),
	consolidate = require("consolidate");

module.exports = function (engine, data, options) {
	"use strict";

	options = options || {};

	if (!engine) {
		throw new Error("gulp-consolidate: No template engine supplied");
	}

	try {
		if (engine === "hogan") {
			require("hogan.js");
		} else {
			require(engine);
		}
	} catch (e) {
		throw new Error("gulp-consolidate: The template engine \"" + engine + "\" was not found. " +
			"Did you forget to install it?\n\n    npm install --save-dev " + engine);
	}

	return map(function (file, callback) {
		var fileData = data || {};

		function render(err, html) {
			if (err) {
				callback(err);
			} else {
				file.contents = new Buffer(html);
				callback(null, file);
			}
		}

		if (typeof fileData === "function") {
			fileData = fileData(file);
		}

		if (file.contents instanceof Buffer) {
			try {
				if (options.useContents) {
					consolidate[engine].render(String(file.contents), fileData, render);
				} else {
					consolidate[engine](file.path, fileData, render);
				}
			} catch (err) {
				callback(err);
			}
		} else {
			callback(new Error("gulp-consolidate: streams not supported"), undefined);
		}
	});
};
