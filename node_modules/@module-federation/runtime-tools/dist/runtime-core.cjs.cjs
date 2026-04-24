'use strict';

var core = require('@module-federation/runtime/core');



Object.prototype.hasOwnProperty.call(core, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: core['__proto__']
	});

Object.keys(core).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = core[k];
});
//# sourceMappingURL=runtime-core.cjs.cjs.map
