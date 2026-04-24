var Dom = require('./Dom');

function DomParser() {
}

DomParser.prototype.parseFromString = function (html) {
  return new Dom(html);
};

module.exports = DomParser;