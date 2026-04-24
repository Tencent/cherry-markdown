'use strict';

var runtimeCore = require('@module-federation/runtime-core');

// injected by bundler, so it can not use runtime-core stuff
function getBuilderId() {
    //@ts-ignore
    return typeof FEDERATION_BUILD_IDENTIFIER !== 'undefined'
        ? //@ts-ignore
            FEDERATION_BUILD_IDENTIFIER
        : '';
}
function getGlobalFederationInstance(name, version) {
    const buildId = getBuilderId();
    return runtimeCore.CurrentGlobal.__FEDERATION__.__INSTANCES__.find((GMInstance) => {
        if (buildId && GMInstance.options.id === buildId) {
            return true;
        }
        if (GMInstance.options.name === name &&
            !GMInstance.options.version &&
            !version) {
            return true;
        }
        if (GMInstance.options.name === name &&
            version &&
            GMInstance.options.version === version) {
            return true;
        }
        return false;
    });
}

exports.getGlobalFederationInstance = getGlobalFederationInstance;
//# sourceMappingURL=utils.cjs.cjs.map
