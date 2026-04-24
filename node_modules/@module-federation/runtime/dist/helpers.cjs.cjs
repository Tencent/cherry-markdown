'use strict';

var runtimeCore = require('@module-federation/runtime-core');
var utils = require('./utils.cjs.cjs');

var helpers = {
    ...runtimeCore.helpers,
    global: {
        ...runtimeCore.helpers.global,
        getGlobalFederationInstance: utils.getGlobalFederationInstance,
    },
};

module.exports = helpers;
//# sourceMappingURL=helpers.cjs.cjs.map
