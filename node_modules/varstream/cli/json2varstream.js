#!/usr/bin/env node

var VarStream = require(__dirname + '/../src/VarStream')
  , fs = require('fs')
;

if(process.argv[2]) {
		var scope = {}, myVarStream;
		// Reading the file
		fs.readFile(process.argv[2], function read(err, data) {
			if (err) {
			  throw err;
			}
			// Parsing the JSON datas
			try {
				scope.vars = JSON.parse(data);
			} catch (err) {
				console.error('Bad JSON file', err);
			}
			// Creating the varstream
			myVarStream = new VarStream(scope, 'vars', VarStream.Writer.OPTIONS);
			// Creating the write stream
			if(!process.argv[3]) {
			  myVarStream.pipe(process.stdout);
			  return;
			}
			var wS = fs.createWriteStream(process.argv[3]);
			// Piping it to the ouput file
			myVarStream.pipe(wS);
			myVarStream.on('close', function() {
				console.log('Saved!');
			});
		});
} else {
	console.log('Usage: ' + process.argv[0] + ' ' + process.argv[1]
	  + ' path/to/input.json path/to/output.dat');
}

