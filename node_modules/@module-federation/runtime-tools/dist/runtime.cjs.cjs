'use strict';

var runtime = require('@module-federation/runtime');



Object.prototype.hasOwnProperty.call(runtime, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: runtime['__proto__']
	});

Object.keys(runtime).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = runtime[k];
});
//# sourceMappingURL=runtime.cjs.cjs.map
