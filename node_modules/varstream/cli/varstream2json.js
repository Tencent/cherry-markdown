#!/usr/bin/env node

var VarStream = require(__dirname + '/../src/VarStream')
  , fs = require('fs')
;

if(process.argv[2]) {
	var scope = {}
	  , myVarStream = new VarStream(scope, 'vars')
	  , rS=fs.createReadStream(process.argv[2])
	;

	rS.pipe(myVarStream)
	  .once('finish', function () {
	    if(!process.argv[3]) {
	      process.stdout.write(JSON.stringify(scope.vars));
	      return;
	    }
		  fs.writeFile(process.argv[3],
			  JSON.stringify(scope.vars),
			  function(err) {
				  if(err) {
					  throw err;
				  }
					console.log('Saved!');
  		  });
		});

} else {
	console.log('Usage: ' + process.argv[0] + ' ' + process.argv[1]
		+ ' path/to/input.dat path/to/output.json');
}

