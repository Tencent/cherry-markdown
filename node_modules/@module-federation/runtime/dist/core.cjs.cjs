'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var runtimeCore = require('@module-federation/runtime-core');

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

var runtimeCore__namespace = /*#__PURE__*/_interopNamespaceDefault(runtimeCore);



exports.default = runtimeCore__namespace;
Object.prototype.hasOwnProperty.call(runtimeCore, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: runtimeCore['__proto__']
	});

Object.keys(runtimeCore).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = runtimeCore[k];
});
//# sourceMappingURL=core.cjs.cjs.map
