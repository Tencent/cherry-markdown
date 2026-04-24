"use strict";

var _v8flags = require("v8flags");
var _path = require("path");
var _child_process = require("child_process");
var _url = require("url");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
const args = [_path.join(_path.dirname(__filename), "_babel-node")];
let babelArgs = process.argv.slice(2);
let userArgs;
const argSeparator = babelArgs.indexOf("--");
if (argSeparator > -1) {
  userArgs = babelArgs.slice(argSeparator);
  babelArgs = babelArgs.slice(0, argSeparator);
}
function getNormalizedV8Flag(arg) {
  const matches = arg.match(/--(?:no)?(.+)/);
  if (matches) {
    return `--${matches[1].replace(/_/g, "-")}`;
  }
  return arg;
}
_v8flags(_asyncToGenerator(function* (err, v8Flags) {
  {
    v8Flags = v8Flags.map(getNormalizedV8Flag);
    (process.allowedNodeEnvironmentFlags || require("node-environment-flags")).forEach(flag => v8Flags.push(getNormalizedV8Flag(flag)));
  }
  const v8FlagsSet = new Set(v8Flags);
  for (let i = 0; i < babelArgs.length; i++) {
    const arg = babelArgs[i];
    const flag = arg.split("=")[0];
    {
      if (flag === "-d") {
        args.unshift("--debug");
        continue;
      } else if (flag === "-gc") {
        args.unshift("--expose-gc");
        continue;
      }
    }
    if (flag === "-r" || flag === "--require") {
      args.push(flag);
      args.push(babelArgs[++i]);
    } else if (flag === "debug" || flag === "inspect" || v8FlagsSet.has(getNormalizedV8Flag(flag))) {
      args.unshift(arg);
    } else {
      args.push(arg);
    }
  }
  if (argSeparator > -1) {
    args.push(...userArgs);
  }
  try {
    const {
      default: kexec
    } = yield Promise.resolve().then(() => _interopRequireWildcard(require("kexec")));
    kexec(process.argv[0], args);
  } catch (err) {
    if (err.code !== "ERR_MODULE_NOT_FOUND" && err.code !== "MODULE_NOT_FOUND" && err.code !== "UNDECLARED_DEPENDENCY") {
      throw err;
    }
    const shouldPassthroughIPC = process.send !== undefined;
    const proc = _child_process.spawn(process.argv[0], args, {
      stdio: shouldPassthroughIPC ? ["inherit", "inherit", "inherit", "ipc"] : "inherit"
    });
    proc.on("exit", function (code, signal) {
      process.on("exit", function () {
        if (signal) {
          process.kill(process.pid, signal);
        } else {
          process.exitCode = code != null ? code : undefined;
        }
      });
    });
    if (shouldPassthroughIPC) {
      proc.on("message", message => process.send(message));
    }
    process.on("SIGINT", () => proc.kill("SIGINT"));
    process.on("SIGTERM", () => proc.kill("SIGTERM"));
  }
}));

//# sourceMappingURL=babel-node.js.map
