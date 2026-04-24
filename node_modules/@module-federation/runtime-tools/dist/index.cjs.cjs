'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var runtime = require('@module-federation/runtime');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		for (var k in e) {
			n[k] = e[k];
		}
	}
	n.default = e;
	return Object.freeze(n);
}

var runtime__namespace = /*#__PURE__*/_interopNamespaceDefault(runtime);



exports.default = runtime__namespace;
Object.prototype.hasOwnProperty.call(runtime, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: runtime['__proto__']
	});

Object.keys(runtime).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = runtime[k];
});
//# sourceMappingURL=index.cjs.cjs.map
