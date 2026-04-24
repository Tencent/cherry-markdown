"use strict";

var commander = _interopRequireWildcard(require("commander"), true);
var _module = _interopRequireWildcard(require("module"), true);
var _util = require("util");
var _path = require("path");
var _repl = require("repl");
var babel = require("@babel/core");
var _vm = require("vm");
require("core-js/stable/index.js");
require("regenerator-runtime/runtime.js");
var _register = require("@babel/register");
var _url = require("url");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const program = commander.default.program;
function collect(value, previousValue) {
  if (typeof value !== "string") return previousValue;
  const values = value.split(",");
  if (previousValue) {
    previousValue.push(...values);
    return previousValue;
  }
  return values;
}
program.name("babel-node");
program.option("-e, --eval [script]", "Evaluate script");
program.option("--no-babelrc", "Specify whether or not to use .babelrc and .babelignore files");
program.option("-r, --require [module]", "Require module");
program.option("-p, --print [code]", "Evaluate script and print result");
program.option("-o, --only [globs]", "A comma-separated list of glob patterns to compile", collect);
program.option("-i, --ignore [globs]", "A comma-separated list of glob patterns to skip compiling", collect);
program.option("-x, --extensions [extensions]", "List of extensions to hook into [.es6,.js,.es,.jsx,.mjs]", collect);
program.option("--config-file [path]", "Path to the babel config file to use. Defaults to working directory babel.config.js");
program.option("--env-name [name]", "The name of the 'env' to use when loading configs and plugins. " + "Defaults to the value of BABEL_ENV, or else NODE_ENV, or else 'development'.");
program.option("--root-mode [mode]", "The project-root resolution mode. " + "One of 'root' (the default), 'upward', or 'upward-optional'.");
program.option("-w, --plugins [string]", "", collect);
program.option("-b, --presets [string]", "", collect);
program.allowUnknownOption(true);
program.version("7.24.7");
program.usage("[options] [ -e script | script.js ] [arguments]");
program.parse(process.argv);
const opts = program.opts();
const babelOptions = {
  caller: {
    name: "@babel/node"
  },
  extensions: opts.extensions,
  ignore: opts.ignore,
  only: opts.only,
  plugins: opts.plugins,
  presets: opts.presets,
  configFile: opts.configFile,
  envName: opts.envName,
  rootMode: opts.rootMode,
  babelrc: opts.babelrc === true ? undefined : opts.babelrc
};
for (const key of Object.keys(babelOptions)) {
  if (babelOptions[key] === undefined) {
    delete babelOptions[key];
  }
}
(0, _register.default)(babelOptions);
const replPlugin = ({
  types: t
}) => ({
  visitor: {
    VariableDeclaration(path) {
      if (path.node.kind !== "var") {
        throw path.buildCodeFrameError("Only `var` variables are supported in the REPL");
      }
    },
    Program(path) {
      let hasExpressionStatement;
      for (const bodyPath of path.get("body")) {
        if (bodyPath.isExpressionStatement()) {
          hasExpressionStatement = true;
        } else if (bodyPath.isExportDeclaration() || bodyPath.isImportDeclaration()) {
          throw bodyPath.buildCodeFrameError("Modules aren't supported in the REPL");
        }
      }
      if (hasExpressionStatement) return;
      path.pushContainer("body", t.expressionStatement(t.identifier("undefined")));
    }
  }
});
const _eval = function (code, filename) {
  code = code.trim();
  if (!code) return undefined;
  code = babel.transformSync(code, {
    filename: filename,
    presets: opts.presets,
    plugins: (opts.plugins || []).concat([replPlugin])
  }).code;
  return _vm.runInThisContext(code, {
    filename: filename
  });
};
if (opts.eval || opts.print) {
  let code = opts.eval;
  if (!code || code === true) code = opts.print;
  global.__filename = "[eval]";
  global.__dirname = process.cwd();
  const module = new _module.default(global.__filename);
  module.filename = global.__filename;
  module.paths = _module.default._nodeModulePaths(global.__dirname);
  global.exports = module.exports;
  global.module = module;
  global.require = module.require.bind(module);
  const result = _eval(code, global.__filename);
  if (opts.print) {
    const output = typeof result === "string" ? result : (0, _util.inspect)(result);
    process.stdout.write(output + "\n");
  }
} else {
  if (program.args.length) {
    let args = process.argv.slice(2);
    let i = 0;
    let ignoreNext = false;
    args.some(function (arg, i2) {
      if (ignoreNext) {
        ignoreNext = false;
        return;
      }
      if (arg[0] === "-") {
        const parsedOption = program.options.find(option => {
          return option.long === arg || option.short === arg;
        });
        if (parsedOption === undefined) {
          return;
        }
        const optionName = parsedOption.attributeName();
        const parsedArg = opts[optionName];
        if (optionName === "require" || parsedArg && parsedArg !== true) {
          ignoreNext = true;
        }
      } else {
        i = i2;
        return true;
      }
    });
    args = args.slice(i);
    requireArgs();
    const filename = args[0];
    if (!_path.isAbsolute(filename)) {
      args[0] = _path.join(process.cwd(), filename);
    }
    process.argv = ["node", ...args];
    process.execArgv.push(__filename);
    _module.default.runMain();
  } else {
    requireArgs();
    replStart();
  }
}
function requireArgs() {
  if (opts.require) {
    require((((v, w) => (v = v.split("."), w = w.split("."), +v[0] > +w[0] || v[0] == w[0] && +v[1] >= +w[1]))(process.versions.node, "8.9") ? require.resolve : (r, {
      paths: [b]
    }, M = require("module")) => {
      let f = M._findPath(r, M._nodeModulePaths(b).concat(b));
      if (f) return f;
      f = new Error(`Cannot resolve module '${r}'`);
      f.code = "MODULE_NOT_FOUND";
      throw f;
    })(opts.require, {
      paths: [process.cwd()]
    }));
  }
}
function replEval(code, context, filename, callback) {
  let err;
  let result;
  try {
    if (code[0] === "(" && code[code.length - 1] === ")") {
      code = code.slice(1, -1);
    }
    result = _eval(code, filename);
  } catch (e) {
    err = e;
  }
  callback(err, result);
}
function replStart() {
  const replServer = _repl.start({
    prompt: "babel > ",
    input: process.stdin,
    output: process.stdout,
    eval: replEval,
    useGlobal: true,
    preview: true
  });
  const NODE_REPL_HISTORY = process.env.NODE_REPL_HISTORY;
  {
    replServer.setupHistory == null || replServer.setupHistory(NODE_REPL_HISTORY, () => {});
  }
}

//# sourceMappingURL=_babel-node.js.map
