/* eslint no-undefined: 0 */
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var format = require('./format');
var _require = require('triple-beam'),
  LEVEL = _require.LEVEL,
  MESSAGE = _require.MESSAGE;

/*
 * function errors (info)
 * If the `message` property of the `info` object is an instance of `Error`,
 * replace the `Error` object its own `message` property.
 *
 * Optionally, the Error's `stack` and/or `cause` properties can also be appended to the `info` object.
 */
module.exports = format(function (einfo, _ref) {
  var stack = _ref.stack,
    cause = _ref.cause;
  if (einfo instanceof Error) {
    var _Object$assign;
    var info = Object.assign({}, einfo, (_Object$assign = {
      level: einfo.level
    }, _defineProperty(_Object$assign, LEVEL, einfo[LEVEL] || einfo.level), _defineProperty(_Object$assign, "message", einfo.message), _defineProperty(_Object$assign, MESSAGE, einfo[MESSAGE] || einfo.message), _Object$assign));
    if (stack) info.stack = einfo.stack;
    if (cause) info.cause = einfo.cause;
    return info;
  }
  if (!(einfo.message instanceof Error)) return einfo;

  // Assign all enumerable properties and the
  // message property from the error provided.
  var err = einfo.message;
  Object.assign(einfo, err);
  einfo.message = err.message;
  einfo[MESSAGE] = err.message;

  // Assign the stack and/or cause if requested.
  if (stack) einfo.stack = err.stack;
  if (cause) einfo.cause = err.cause;
  return einfo;
});