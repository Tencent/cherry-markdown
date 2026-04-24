'use strict';

try {
  module.exports = require('bindings')('addon.node').convert;
} catch (err) {
  module.exports = require('../jssrc/index.js');
}
