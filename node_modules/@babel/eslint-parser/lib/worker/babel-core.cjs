"use strict";

module.exports = exports;
function initialize(babel) {
  exports.init = null;
  exports.version = babel.version;
  exports.traverse = babel.traverse;
  exports.types = babel.types;
  exports.tokTypes = babel.tokTypes;
  exports.parseSync = babel.parseSync;
  exports.parseAsync = babel.parseAsync;
  exports.loadPartialConfigSync = babel.loadPartialConfigSync;
  exports.loadPartialConfigAsync = babel.loadPartialConfigAsync;
  exports.createConfigItemAsync = babel.createConfigItemAsync;
  {
    exports.createConfigItemSync = babel.createConfigItemSync || babel.createConfigItem;
  }
}
{
  initialize(require("@babel/core"));
}

//# sourceMappingURL=babel-core.cjs.map
