"use strict";

function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
const babel = require("./babel-core.cjs");
const convert = require("../convert/index.cjs");
const astInfo = require("./ast-info.cjs");
const extractParserOptionsPlugin = require("./extract-parser-options-plugin.cjs");
const {
  getVisitorKeys,
  getTokLabels
} = astInfo;
const ref = {};
let extractParserOptionsConfigItem;
const MULTIPLE_OVERRIDES = /More than one plugin attempted to override parsing/;
module.exports = function () {
  var _asyncMaybeParse = _asyncToGenerator(function* (code, options) {
    if (!extractParserOptionsConfigItem) {
      extractParserOptionsConfigItem = yield babel.createConfigItemAsync([extractParserOptionsPlugin, ref], {
        dirname: __dirname,
        type: "plugin"
      });
    }
    const {
      plugins
    } = options;
    options.plugins = plugins.concat(extractParserOptionsConfigItem);
    let ast;
    try {
      return {
        parserOptions: yield babel.parseAsync(code, options),
        ast: null
      };
    } catch (err) {
      if (!MULTIPLE_OVERRIDES.test(err.message)) {
        throw err;
      }
    }
    options.plugins = plugins;
    try {
      ast = yield babel.parseAsync(code, options);
    } catch (err) {
      throw convert.convertError(err);
    }
    return {
      ast: convert.convertFile(ast, code, getTokLabels(), getVisitorKeys()),
      parserOptions: null
    };
  });
  function asyncMaybeParse(_x, _x2) {
    return _asyncMaybeParse.apply(this, arguments);
  }
  return asyncMaybeParse;
}();

//# sourceMappingURL=maybeParse.cjs.map
