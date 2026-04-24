'use strict';

var _ = require('lodash');

// Taken from the punycode library
function ucs2encode(array) {
  return _.map(array, function (value) {
    var output = '';

    if (value > 0xFFFF) {
      value -= 0x10000;
      output += String.fromCharCode(value >>> 10 & 0x3FF | 0xD800);
      value = 0xDC00 | value & 0x3FF;
    }
    output += String.fromCharCode(value);
    return output;
  }).join('');
}

function ucs2decode(string) {
  var output = [],
      counter = 0,
      length = string.length,
      value,
      extra;

  while (counter < length) {
    value = string.charCodeAt(counter++);
    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
      // high surrogate, and there is a next character
      extra = string.charCodeAt(counter++);
      if ((extra & 0xFC00) === 0xDC00) { // low surrogate
        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
      } else {
        // unmatched surrogate; only append this code unit, in case the next
        // code unit is the high surrogate of a surrogate pair
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}

module.exports = {
  encode: ucs2encode,
  decode: ucs2decode
};
