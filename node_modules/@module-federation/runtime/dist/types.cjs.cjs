'use strict';

var types = require('@module-federation/runtime-core/types');



Object.prototype.hasOwnProperty.call(types, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: types['__proto__']
	});

Object.keys(types).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = types[k];
});
//# sourceMappingURL=types.cjs.cjs.map
