#!/usr/bin/env node
/*
 Author: Sergey Batishchev <sergej.batishchev@gmail.com>

 Written for fontello.com project.
 */

/*eslint-disable no-console*/

'use strict';


var fs = require('fs');
var ArgumentParser = require('argparse').ArgumentParser;

var svg2ttf = require('./');


var parser = new ArgumentParser({
  version: require('./package.json').version,
  addHelp: true,
  description: 'SVG to TTF font converter'
});

parser.addArgument(
  [ '-c', '--copyright' ],
  {
    help: 'Copyright text',
    required: false
  }
);

parser.addArgument(
  [ '-d', '--description' ],
  {
    help: 'Override default description text',
    required: false,
    type: 'string'
  }
);

parser.addArgument(
  [ '--ts' ],
  {
    help: 'Override font creation time (Unix time stamp)',
    required: false,
    type: 'int'
  }
);

parser.addArgument(
  [ '-u', '--url' ],
  {
    help: 'Override default manufacturer url',
    required: false,
    type: 'string'
  }
);

parser.addArgument(
  [ '--vs' ],
  {
    help: 'Override default font version string (Version 1.0), can be "x.y" or "Version x.y"',
    required: false,
    type: 'string'
  }
);

parser.addArgument(
  [ 'infile' ],
  {
    nargs: 1,
    help: 'Input file'
  }
);

parser.addArgument(
  [ 'outfile' ],
  {
    nargs: 1,
    help: 'Output file'
  }
);


var args = parser.parseArgs();
var svg;
var options = {};

try {
  svg = fs.readFileSync(args.infile[0], 'utf-8');
} catch (e) {
  console.error("Can't open input file (%s)", args.infile[0]);
  process.exit(1);
}

if (args.copyright) options.copyright = args.copyright;

if (args.description) options.description = args.description;

if (args.ts !== null) options.ts = args.ts;

if (args.url) options.url = args.url;

if (args.vs) options.version = args.vs;

var result = Buffer.from ?
  Buffer.from(svg2ttf(svg, options).buffer)
  :
  new Buffer(svg2ttf(svg, options).buffer);

fs.writeFileSync(args.outfile[0], result);
