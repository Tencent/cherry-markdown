import * as runtime from '@module-federation/runtime';
import { FEDERATION_SUPPORTED_TYPES } from './constant.esm.js';
import { decodeName, ENCODE_NAME_PREFIX } from '@module-federation/sdk';

function attachShareScopeMap(webpackRequire) {
    if (!webpackRequire.S ||
        webpackRequire.federation.hasAttachShareScopeMap ||
        !webpackRequire.federation.instance ||
        !webpackRequire.federation.instance.shareScopeMap) {
        return;
    }
    webpackRequire.S = webpackRequire.federation.instance.shareScopeMap;
    webpackRequire.federation.hasAttachShareScopeMap = true;
}

function updateConsumeOptions(options) {
    const { webpackRequire, moduleToHandlerMapping } = options;
    const { consumesLoadingData, initializeSharingData } = webpackRequire;
    if (consumesLoadingData && !consumesLoadingData._updated) {
        const { moduleIdToConsumeDataMapping: updatedModuleIdToConsumeDataMapping = {}, initialConsumes: updatedInitialConsumes = [], chunkMapping: updatedChunkMapping = {}, } = consumesLoadingData;
        Object.entries(updatedModuleIdToConsumeDataMapping).forEach(([id, data]) => {
            if (!moduleToHandlerMapping[id]) {
                moduleToHandlerMapping[id] = {
                    getter: data.fallback,
                    shareInfo: {
                        shareConfig: {
                            requiredVersion: data.requiredVersion,
                            strictVersion: data.strictVersion,
                            singleton: data.singleton,
                            eager: data.eager,
                            layer: data.layer,
                        },
                        scope: Array.isArray(data.shareScope)
                            ? data.shareScope
                            : [data.shareScope || 'default'],
                    },
                    shareKey: data.shareKey,
                };
            }
        });
        if ('initialConsumes' in options) {
            const { initialConsumes = [] } = options;
            updatedInitialConsumes.forEach((id) => {
                if (!initialConsumes.includes(id)) {
                    initialConsumes.push(id);
                }
            });
        }
        if ('chunkMapping' in options) {
            const { chunkMapping = {} } = options;
            Object.entries(updatedChunkMapping).forEach(([id, chunkModules]) => {
                if (!chunkMapping[id]) {
                    chunkMapping[id] = [];
                }
                chunkModules.forEach((moduleId) => {
                    if (!chunkMapping[id].includes(moduleId)) {
                        chunkMapping[id].push(moduleId);
                    }
                });
            });
        }
        consumesLoadingData._updated = 1;
    }
    if (initializeSharingData && !initializeSharingData._updated) {
        const { federation } = webpackRequire;
        if (!federation.instance ||
            !initializeSharingData.scopeToSharingDataMapping) {
            return;
        }
        const shared = {};
        for (let [scope, stages] of Object.entries(initializeSharingData.scopeToSharingDataMapping)) {
            for (let stage of stages) {
                if (typeof stage === 'object' && stage !== null) {
                    const { name, version, factory, eager, singleton, requiredVersion, strictVersion, } = stage;
                    const shareConfig = {
                        requiredVersion: `^${version}`,
                    };
                    const isValidValue = function (val) {
                        return typeof val !== 'undefined';
                    };
                    if (isValidValue(singleton)) {
                        shareConfig.singleton = singleton;
                    }
                    if (isValidValue(requiredVersion)) {
                        shareConfig.requiredVersion = requiredVersion;
                    }
                    if (isValidValue(eager)) {
                        shareConfig.eager = eager;
                    }
                    if (isValidValue(strictVersion)) {
                        shareConfig.strictVersion = strictVersion;
                    }
                    const options = {
                        version,
                        scope: [scope],
                        shareConfig,
                        get: factory,
                    };
                    if (shared[name]) {
                        shared[name].push(options);
                    }
                    else {
                        shared[name] = [options];
                    }
                }
            }
        }
        federation.instance.registerShared(shared);
        initializeSharingData._updated = 1;
    }
}
function updateRemoteOptions(options) {
    const { webpackRequire, idToExternalAndNameMapping = {}, idToRemoteMap = {}, chunkMapping = {}, } = options;
    const { remotesLoadingData } = webpackRequire;
    const remoteInfos = webpackRequire.federation?.bundlerRuntimeOptions?.remotes?.remoteInfos;
    if (!remotesLoadingData || remotesLoadingData._updated || !remoteInfos) {
        return;
    }
    const { chunkMapping: updatedChunkMapping, moduleIdToRemoteDataMapping } = remotesLoadingData;
    if (!updatedChunkMapping || !moduleIdToRemoteDataMapping) {
        return;
    }
    for (let [moduleId, data] of Object.entries(moduleIdToRemoteDataMapping)) {
        if (!idToExternalAndNameMapping[moduleId]) {
            idToExternalAndNameMapping[moduleId] = [
                data.shareScope,
                data.name,
                data.externalModuleId,
            ];
        }
        if (!idToRemoteMap[moduleId] && remoteInfos[data.remoteName]) {
            const items = remoteInfos[data.remoteName];
            idToRemoteMap[moduleId] ||= [];
            items.forEach((item) => {
                if (!idToRemoteMap[moduleId].includes(item)) {
                    idToRemoteMap[moduleId].push(item);
                }
            });
        }
    }
    if (chunkMapping) {
        Object.entries(updatedChunkMapping).forEach(([id, chunkModules]) => {
            if (!chunkMapping[id]) {
                chunkMapping[id] = [];
            }
            chunkModules.forEach((moduleId) => {
                if (!chunkMapping[id].includes(moduleId)) {
                    chunkMapping[id].push(moduleId);
                }
            });
        });
    }
    remotesLoadingData._updated = 1;
}

function remotes(options) {
    updateRemoteOptions(options);
    const { chunkId, promises, webpackRequire, chunkMapping, idToExternalAndNameMapping, idToRemoteMap, } = options;
    attachShareScopeMap(webpackRequire);
    if (webpackRequire.o(chunkMapping, chunkId)) {
        chunkMapping[chunkId].forEach((id) => {
            let getScope = webpackRequire.R;
            if (!getScope) {
                getScope = [];
            }
            const data = idToExternalAndNameMapping[id];
            const remoteInfos = idToRemoteMap[id] || [];
            // @ts-ignore seems not work
            if (getScope.indexOf(data) >= 0) {
                return;
            }
            // @ts-ignore seems not work
            getScope.push(data);
            if (data.p) {
                return promises.push(data.p);
            }
            const onError = (error) => {
                if (!error) {
                    error = new Error('Container missing');
                }
                if (typeof error.message === 'string') {
                    error.message += `\nwhile loading "${data[1]}" from ${data[2]}`;
                }
                webpackRequire.m[id] = () => {
                    throw error;
                };
                data.p = 0;
            };
            const handleFunction = (fn, arg1, arg2, d, next, first) => {
                try {
                    const promise = fn(arg1, arg2);
                    if (promise && promise.then) {
                        const p = promise.then((result) => next(result, d), onError);
                        if (first) {
                            promises.push((data.p = p));
                        }
                        else {
                            return p;
                        }
                    }
                    else {
                        return next(promise, d, first);
                    }
                }
                catch (error) {
                    onError(error);
                }
            };
            const onExternal = (external, _, first) => external
                ? handleFunction(webpackRequire.I, data[0], 0, external, onInitialized, first)
                : onError();
            // eslint-disable-next-line no-var
            var onInitialized = (_, external, first) => handleFunction(external.get, data[1], getScope, 0, onFactory, first);
            // eslint-disable-next-line no-var
            var onFactory = (factory) => {
                data.p = 1;
                webpackRequire.m[id] = (module) => {
                    module.exports = factory();
                };
            };
            const onRemoteLoaded = () => {
                try {
                    const remoteName = decodeName(remoteInfos[0].name, ENCODE_NAME_PREFIX);
                    const remoteModuleName = remoteName + data[1].slice(1);
                    const instance = webpackRequire.federation.instance;
                    const loadRemote = () => webpackRequire.federation.instance.loadRemote(remoteModuleName, {
                        loadFactory: false,
                        from: 'build',
                    });
                    if (instance.options.shareStrategy === 'version-first') {
                        return Promise.all(instance.sharedHandler.initializeSharing(data[0])).then(() => {
                            return loadRemote();
                        });
                    }
                    return loadRemote();
                }
                catch (error) {
                    onError(error);
                }
            };
            const useRuntimeLoad = remoteInfos.length === 1 &&
                FEDERATION_SUPPORTED_TYPES.includes(remoteInfos[0].externalType) &&
                remoteInfos[0].name;
            if (useRuntimeLoad) {
                handleFunction(onRemoteLoaded, data[2], 0, 0, onFactory, 1);
            }
            else {
                handleFunction(webpackRequire, data[2], 0, 0, onExternal, 1);
            }
        });
    }
}

function consumes(options) {
    updateConsumeOptions(options);
    const { chunkId, promises, installedModules, webpackRequire, chunkMapping, moduleToHandlerMapping, } = options;
    attachShareScopeMap(webpackRequire);
    if (webpackRequire.o(chunkMapping, chunkId)) {
        chunkMapping[chunkId].forEach((id) => {
            if (webpackRequire.o(installedModules, id)) {
                return promises.push(installedModules[id]);
            }
            const onFactory = (factory) => {
                installedModules[id] = 0;
                webpackRequire.m[id] = (module) => {
                    delete webpackRequire.c[id];
                    const result = factory();
                    // Add layer property from shareConfig if available
                    const { shareInfo } = moduleToHandlerMapping[id];
                    if (shareInfo?.shareConfig?.layer &&
                        result &&
                        typeof result === 'object') {
                        try {
                            // Only set layer if it's not already defined or if it's undefined
                            if (!result.hasOwnProperty('layer') ||
                                result.layer === undefined) {
                                result.layer = shareInfo.shareConfig.layer;
                            }
                        }
                        catch (e) {
                            // Ignore if layer property is read-only
                        }
                    }
                    module.exports = result;
                };
            };
            const onError = (error) => {
                delete installedModules[id];
                webpackRequire.m[id] = (module) => {
                    delete webpackRequire.c[id];
                    throw error;
                };
            };
            try {
                const federationInstance = webpackRequire.federation.instance;
                if (!federationInstance) {
                    throw new Error('Federation instance not found!');
                }
                const { shareKey, getter, shareInfo } = moduleToHandlerMapping[id];
                const promise = federationInstance
                    .loadShare(shareKey, { customShareInfo: shareInfo })
                    .then((factory) => {
                    if (factory === false) {
                        return getter();
                    }
                    return factory;
                });
                if (promise.then) {
                    promises.push((installedModules[id] = promise.then(onFactory).catch(onError)));
                }
                else {
                    // @ts-ignore maintain previous logic
                    onFactory(promise);
                }
            }
            catch (e) {
                onError(e);
            }
        });
    }
}

function initializeSharing({ shareScopeName, webpackRequire, initPromises, initTokens, initScope, }) {
    const shareScopeKeys = Array.isArray(shareScopeName)
        ? shareScopeName
        : [shareScopeName];
    var initializeSharingPromises = [];
    var _initializeSharing = function (shareScopeKey) {
        if (!initScope)
            initScope = [];
        const mfInstance = webpackRequire.federation.instance;
        // handling circular init calls
        var initToken = initTokens[shareScopeKey];
        if (!initToken)
            initToken = initTokens[shareScopeKey] = { from: mfInstance.name };
        if (initScope.indexOf(initToken) >= 0)
            return;
        initScope.push(initToken);
        const promise = initPromises[shareScopeKey];
        if (promise)
            return promise;
        var warn = (msg) => typeof console !== 'undefined' && console.warn && console.warn(msg);
        var initExternal = (id) => {
            var handleError = (err) => warn('Initialization of sharing external failed: ' + err);
            try {
                var module = webpackRequire(id);
                if (!module)
                    return;
                var initFn = (module) => module &&
                    module.init &&
                    // @ts-ignore compat legacy mf shared behavior
                    module.init(webpackRequire.S[shareScopeKey], initScope, {
                        shareScopeMap: webpackRequire.S || {},
                        shareScopeKeys: shareScopeName,
                    });
                if (module.then)
                    return promises.push(module.then(initFn, handleError));
                var initResult = initFn(module);
                // @ts-ignore
                if (initResult && typeof initResult !== 'boolean' && initResult.then)
                    // @ts-ignore
                    return promises.push(initResult['catch'](handleError));
            }
            catch (err) {
                handleError(err);
            }
        };
        const promises = mfInstance.initializeSharing(shareScopeKey, {
            strategy: mfInstance.options.shareStrategy,
            initScope,
            from: 'build',
        });
        attachShareScopeMap(webpackRequire);
        const bundlerRuntimeRemotesOptions = webpackRequire.federation.bundlerRuntimeOptions.remotes;
        if (bundlerRuntimeRemotesOptions) {
            Object.keys(bundlerRuntimeRemotesOptions.idToRemoteMap).forEach((moduleId) => {
                const info = bundlerRuntimeRemotesOptions.idToRemoteMap[moduleId];
                const externalModuleId = bundlerRuntimeRemotesOptions.idToExternalAndNameMapping[moduleId][2];
                if (info.length > 1) {
                    initExternal(externalModuleId);
                }
                else if (info.length === 1) {
                    const remoteInfo = info[0];
                    if (!FEDERATION_SUPPORTED_TYPES.includes(remoteInfo.externalType)) {
                        initExternal(externalModuleId);
                    }
                }
            });
        }
        if (!promises.length) {
            return (initPromises[shareScopeKey] = true);
        }
        return (initPromises[shareScopeKey] = Promise.all(promises).then(() => (initPromises[shareScopeKey] = true)));
    };
    shareScopeKeys.forEach((key) => {
        initializeSharingPromises.push(_initializeSharing(key));
    });
    return Promise.all(initializeSharingPromises).then(() => true);
}

function handleInitialConsumes(options) {
    const { moduleId, moduleToHandlerMapping, webpackRequire } = options;
    const federationInstance = webpackRequire.federation.instance;
    if (!federationInstance) {
        throw new Error('Federation instance not found!');
    }
    const { shareKey, shareInfo } = moduleToHandlerMapping[moduleId];
    try {
        return federationInstance.loadShareSync(shareKey, {
            customShareInfo: shareInfo,
        });
    }
    catch (err) {
        console.error('loadShareSync failed! The function should not be called unless you set "eager:true". If you do not set it, and encounter this issue, you can check whether an async boundary is implemented.');
        console.error('The original error message is as follows: ');
        throw err;
    }
}
function installInitialConsumes(options) {
    const { webpackRequire } = options;
    updateConsumeOptions(options);
    const { initialConsumes, moduleToHandlerMapping, installedModules } = options;
    initialConsumes.forEach((id) => {
        webpackRequire.m[id] = (module) => {
            // Handle scenario when module is used synchronously
            installedModules[id] = 0;
            delete webpackRequire.c[id];
            const factory = handleInitialConsumes({
                moduleId: id,
                moduleToHandlerMapping,
                webpackRequire,
            });
            if (typeof factory !== 'function') {
                throw new Error(`Shared module is not available for eager consumption: ${id}`);
            }
            const result = factory();
            // Add layer property from shareConfig if available
            const { shareInfo } = moduleToHandlerMapping[id];
            if (shareInfo?.shareConfig?.layer &&
                result &&
                typeof result === 'object') {
                try {
                    // Only set layer if it's not already defined or if it's undefined
                    if (!result.hasOwnProperty('layer') ||
                        result.layer === undefined) {
                        result.layer = shareInfo.shareConfig.layer;
                    }
                }
                catch (e) {
                    // Ignore if layer property is read-only
                }
            }
            module.exports = result;
        };
    });
}

function initContainerEntry(options) {
    const { webpackRequire, shareScope, initScope, shareScopeKey, remoteEntryInitOptions, } = options;
    if (!webpackRequire.S)
        return;
    if (!webpackRequire.federation ||
        !webpackRequire.federation.instance ||
        !webpackRequire.federation.initOptions)
        return;
    const federationInstance = webpackRequire.federation.instance;
    federationInstance.initOptions({
        name: webpackRequire.federation.initOptions.name,
        remotes: [],
        ...remoteEntryInitOptions,
    });
    const hostShareScopeKeys = remoteEntryInitOptions?.shareScopeKeys;
    const hostShareScopeMap = remoteEntryInitOptions?.shareScopeMap;
    // host: 'default' remote: 'default'  remote['default'] = hostShareScopeMap['default']
    // host: ['default', 'scope1'] remote: 'default'  remote['default'] = hostShareScopeMap['default']; remote['scope1'] = hostShareScopeMap['scop1']
    // host: 'default' remote: ['default','scope1']  remote['default'] = hostShareScopeMap['default']; remote['scope1'] = hostShareScopeMap['scope1'] = {}
    // host: ['scope1','default'] remote: ['scope1','scope2'] => remote['scope1'] = hostShareScopeMap['scope1']; remote['scope2'] = hostShareScopeMap['scope2'] = {};
    if (!shareScopeKey || typeof shareScopeKey === 'string') {
        const key = shareScopeKey || 'default';
        if (Array.isArray(hostShareScopeKeys)) {
            // const sc = hostShareScopeMap![key];
            // if (!sc) {
            //   throw new Error('shareScopeKey is not exist in hostShareScopeMap');
            // }
            // federationInstance.initShareScopeMap(key, sc, {
            //   hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
            // });
            hostShareScopeKeys.forEach((hostKey) => {
                if (!hostShareScopeMap[hostKey]) {
                    hostShareScopeMap[hostKey] = {};
                }
                const sc = hostShareScopeMap[hostKey];
                federationInstance.initShareScopeMap(hostKey, sc, {
                    hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
                });
            });
        }
        else {
            federationInstance.initShareScopeMap(key, shareScope, {
                hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
            });
        }
    }
    else {
        shareScopeKey.forEach((key) => {
            if (!hostShareScopeKeys || !hostShareScopeMap) {
                federationInstance.initShareScopeMap(key, shareScope, {
                    hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
                });
                return;
            }
            if (!hostShareScopeMap[key]) {
                hostShareScopeMap[key] = {};
            }
            const sc = hostShareScopeMap[key];
            federationInstance.initShareScopeMap(key, sc, {
                hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
            });
        });
    }
    if (webpackRequire.federation.attachShareScopeMap) {
        webpackRequire.federation.attachShareScopeMap(webpackRequire);
    }
    if (typeof webpackRequire.federation.prefetch === 'function') {
        webpackRequire.federation.prefetch();
    }
    if (!Array.isArray(shareScopeKey)) {
        // @ts-ignore
        return webpackRequire.I(shareScopeKey || 'default', initScope);
    }
    var proxyInitializeSharing = Boolean(webpackRequire.federation.initOptions.shared);
    if (proxyInitializeSharing) {
        // @ts-ignore
        return webpackRequire.I(shareScopeKey, initScope);
    }
    // @ts-ignore
    return Promise.all(shareScopeKey.map((key) => {
        // @ts-ignore
        return webpackRequire.I(key, initScope);
    })).then(() => true);
}

const federation = {
    runtime,
    instance: undefined,
    initOptions: undefined,
    bundlerRuntime: {
        remotes,
        consumes,
        I: initializeSharing,
        S: {},
        installInitialConsumes,
        initContainerEntry,
    },
    attachShareScopeMap,
    bundlerRuntimeOptions: {},
};

export { federation as default };
//# sourceMappingURL=index.esm.js.map
