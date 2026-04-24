var assert = require('assert');
var VarStream = require('varstream');
var os = require('os');


function neatEqual(current, expected, ordered) {
  var currentTransformed = VarStream.stringify(current).split(/\r?\n/);
  var expectedTransformed = VarStream.stringify(expected).split(/\r?\n/);

  if(!ordered) {
    currentTransformed = currentTransformed.sort();
    expectedTransformed = expectedTransformed.sort();
  }

  assert.equal(currentTransformed.join(os.EOL), expectedTransformed.join(os.EOL));
}

module.exports = neatEqual;

