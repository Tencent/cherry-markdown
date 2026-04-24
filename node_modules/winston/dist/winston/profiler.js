/**
 * profiler.js: TODO: add file header description.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

/**
 * TODO: add class description.
 * @type {Profiler}
 * @private
 */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Profiler = /*#__PURE__*/function () {
  /**
   * Constructor function for the Profiler instance used by
   * `Logger.prototype.startTimer`. When done is called the timer will finish
   * and log the duration.
   * @param {!Logger} logger - TODO: add param description.
   * @private
   */
  function Profiler(logger) {
    _classCallCheck(this, Profiler);
    var Logger = require('./logger');
    if (_typeof(logger) !== 'object' || Array.isArray(logger) || !(logger instanceof Logger)) {
      throw new Error('Logger is required for profiling');
    } else {
      this.logger = logger;
      this.start = Date.now();
    }
  }

  /**
   * Ends the current timer (i.e. Profiler) instance and logs the `msg` along
   * with the duration since creation.
   * @returns {mixed} - TODO: add return description.
   * @private
   */
  _createClass(Profiler, [{
    key: "done",
    value: function done() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      if (typeof args[args.length - 1] === 'function') {
        // eslint-disable-next-line no-console
        console.warn('Callback function no longer supported as of winston@3.0.0');
        args.pop();
      }
      var info = _typeof(args[args.length - 1]) === 'object' ? args.pop() : {};
      info.level = info.level || 'info';
      info.durationMs = Date.now() - this.start;
      return this.logger.write(info);
    }
  }]);
  return Profiler;
}();
;
module.exports = Profiler;