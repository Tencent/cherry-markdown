import { setGlobalFederationConstructor, ModuleFederation, getGlobalFederationConstructor, setGlobalFederationInstance, assert } from '@module-federation/runtime-core';
export { Module, ModuleFederation, getRemoteEntry, getRemoteInfo, loadScript, loadScriptNode, registerGlobalPlugins } from '@module-federation/runtime-core';
import { getShortErrorMsg, RUNTIME_009, runtimeDescMap } from '@module-federation/error-codes';
import { g as getGlobalFederationInstance } from './utils.esm.js';

function createInstance(options) {
    // Retrieve debug constructor
    const ModuleFederationConstructor = getGlobalFederationConstructor() || ModuleFederation;
    const instance = new ModuleFederationConstructor(options);
    setGlobalFederationInstance(instance);
    return instance;
}
let FederationInstance = null;
/**
 * @deprecated Use createInstance or getInstance instead
 */
function init(options) {
    // Retrieve the same instance with the same name
    const instance = getGlobalFederationInstance(options.name, options.version);
    if (!instance) {
        FederationInstance = createInstance(options);
        return FederationInstance;
    }
    else {
        // Merge options
        instance.initOptions(options);
        if (!FederationInstance) {
            FederationInstance = instance;
        }
        return instance;
    }
}
function loadRemote(...args) {
    assert(FederationInstance, getShortErrorMsg(RUNTIME_009, runtimeDescMap));
    const loadRemote = FederationInstance.loadRemote;
    // eslint-disable-next-line prefer-spread
    return loadRemote.apply(FederationInstance, args);
}
function loadShare(...args) {
    assert(FederationInstance, getShortErrorMsg(RUNTIME_009, runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    const loadShare = FederationInstance.loadShare;
    return loadShare.apply(FederationInstance, args);
}
function loadShareSync(...args) {
    assert(FederationInstance, getShortErrorMsg(RUNTIME_009, runtimeDescMap));
    const loadShareSync = FederationInstance.loadShareSync;
    // eslint-disable-next-line prefer-spread
    return loadShareSync.apply(FederationInstance, args);
}
function preloadRemote(...args) {
    assert(FederationInstance, getShortErrorMsg(RUNTIME_009, runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.preloadRemote.apply(FederationInstance, args);
}
function registerRemotes(...args) {
    assert(FederationInstance, getShortErrorMsg(RUNTIME_009, runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerRemotes.apply(FederationInstance, args);
}
function registerPlugins(...args) {
    assert(FederationInstance, getShortErrorMsg(RUNTIME_009, runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerPlugins.apply(FederationInstance, args);
}
function getInstance() {
    return FederationInstance;
}
function registerShared(...args) {
    assert(FederationInstance, getShortErrorMsg(RUNTIME_009, runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerShared.apply(FederationInstance, args);
}
// Inject for debug
setGlobalFederationConstructor(ModuleFederation);

export { createInstance, getInstance, init, loadRemote, loadShare, loadShareSync, preloadRemote, registerPlugins, registerRemotes, registerShared };
//# sourceMappingURL=index.esm.js.map
