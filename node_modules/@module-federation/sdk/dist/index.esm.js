const FederationModuleManifest = 'federation-manifest.json';
const MANIFEST_EXT = '.json';
const BROWSER_LOG_KEY = 'FEDERATION_DEBUG';
const NameTransformSymbol = {
    AT: '@',
    HYPHEN: '-',
    SLASH: '/',
};
const NameTransformMap = {
    [NameTransformSymbol.AT]: 'scope_',
    [NameTransformSymbol.HYPHEN]: '_',
    [NameTransformSymbol.SLASH]: '__',
};
const EncodedNameTransformMap = {
    [NameTransformMap[NameTransformSymbol.AT]]: NameTransformSymbol.AT,
    [NameTransformMap[NameTransformSymbol.HYPHEN]]: NameTransformSymbol.HYPHEN,
    [NameTransformMap[NameTransformSymbol.SLASH]]: NameTransformSymbol.SLASH,
};
const SEPARATOR = ':';
const ManifestFileName = 'mf-manifest.json';
const StatsFileName = 'mf-stats.json';
const MFModuleType = {
    NPM: 'npm',
    APP: 'app',
};
const MODULE_DEVTOOL_IDENTIFIER = '__MF_DEVTOOLS_MODULE_INFO__';
const ENCODE_NAME_PREFIX = 'ENCODE_NAME_PREFIX';
const TEMP_DIR = '.federation';
const MFPrefetchCommon = {
    identifier: 'MFDataPrefetch',
    globalKey: '__PREFETCH__',
    library: 'mf-data-prefetch',
    exportsKey: '__PREFETCH_EXPORTS__',
    fileName: 'bootstrap.js',
};

/*
 * This file was automatically generated.
 * DO NOT MODIFY BY HAND.
 * Run `yarn special-lint-fix` to update
 */

var ContainerPlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

/*
 * This file was automatically generated.
 * DO NOT MODIFY BY HAND.
 * Run `yarn special-lint-fix` to update
 */

var ContainerReferencePlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

var ModuleFederationPlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

/*
 * This file was automatically generated.
 * DO NOT MODIFY BY HAND.
 * Run `yarn special-lint-fix` to update
 */

var SharePlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

function isBrowserEnv() {
    return (typeof window !== 'undefined' && typeof window.document !== 'undefined');
}
function isReactNativeEnv() {
    return (typeof navigator !== 'undefined' && navigator?.product === 'ReactNative');
}
function isBrowserDebug() {
    try {
        if (isBrowserEnv() && window.localStorage) {
            return Boolean(localStorage.getItem(BROWSER_LOG_KEY));
        }
    }
    catch (error) {
        return false;
    }
    return false;
}
function isDebugMode() {
    if (typeof process !== 'undefined' &&
        process.env &&
        process.env['FEDERATION_DEBUG']) {
        return Boolean(process.env['FEDERATION_DEBUG']);
    }
    if (typeof FEDERATION_DEBUG !== 'undefined' && Boolean(FEDERATION_DEBUG)) {
        return true;
    }
    return isBrowserDebug();
}
const getProcessEnv = function () {
    return typeof process !== 'undefined' && process.env ? process.env : {};
};

const LOG_CATEGORY = '[ Federation Runtime ]';
// entry: name:version   version : 1.0.0 | ^1.2.3
// entry: name:entry  entry:  https://localhost:9000/federation-manifest.json
const parseEntry = (str, devVerOrUrl, separator = SEPARATOR) => {
    const strSplit = str.split(separator);
    const devVersionOrUrl = getProcessEnv()['NODE_ENV'] === 'development' && devVerOrUrl;
    const defaultVersion = '*';
    const isEntry = (s) => s.startsWith('http') || s.includes(MANIFEST_EXT);
    // Check if the string starts with a type
    if (strSplit.length >= 2) {
        let [name, ...versionOrEntryArr] = strSplit;
        // @name@manifest-url.json
        if (str.startsWith(separator)) {
            name = strSplit.slice(0, 2).join(separator);
            versionOrEntryArr = [
                devVersionOrUrl || strSplit.slice(2).join(separator),
            ];
        }
        let versionOrEntry = devVersionOrUrl || versionOrEntryArr.join(separator);
        if (isEntry(versionOrEntry)) {
            return {
                name,
                entry: versionOrEntry,
            };
        }
        else {
            // Apply version rule
            // devVersionOrUrl => inputVersion => defaultVersion
            return {
                name,
                version: versionOrEntry || defaultVersion,
            };
        }
    }
    else if (strSplit.length === 1) {
        const [name] = strSplit;
        if (devVersionOrUrl && isEntry(devVersionOrUrl)) {
            return {
                name,
                entry: devVersionOrUrl,
            };
        }
        return {
            name,
            version: devVersionOrUrl || defaultVersion,
        };
    }
    else {
        throw `Invalid entry value: ${str}`;
    }
};
const composeKeyWithSeparator = function (...args) {
    if (!args.length) {
        return '';
    }
    return args.reduce((sum, cur) => {
        if (!cur) {
            return sum;
        }
        if (!sum) {
            return cur;
        }
        return `${sum}${SEPARATOR}${cur}`;
    }, '');
};
const encodeName = function (name, prefix = '', withExt = false) {
    try {
        const ext = withExt ? '.js' : '';
        return `${prefix}${name
            .replace(new RegExp(`${NameTransformSymbol.AT}`, 'g'), NameTransformMap[NameTransformSymbol.AT])
            .replace(new RegExp(`${NameTransformSymbol.HYPHEN}`, 'g'), NameTransformMap[NameTransformSymbol.HYPHEN])
            .replace(new RegExp(`${NameTransformSymbol.SLASH}`, 'g'), NameTransformMap[NameTransformSymbol.SLASH])}${ext}`;
    }
    catch (err) {
        throw err;
    }
};
const decodeName = function (name, prefix, withExt) {
    try {
        let decodedName = name;
        if (prefix) {
            if (!decodedName.startsWith(prefix)) {
                return decodedName;
            }
            decodedName = decodedName.replace(new RegExp(prefix, 'g'), '');
        }
        decodedName = decodedName
            .replace(new RegExp(`${NameTransformMap[NameTransformSymbol.AT]}`, 'g'), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.AT]])
            .replace(new RegExp(`${NameTransformMap[NameTransformSymbol.SLASH]}`, 'g'), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.SLASH]])
            .replace(new RegExp(`${NameTransformMap[NameTransformSymbol.HYPHEN]}`, 'g'), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.HYPHEN]]);
        if (withExt) {
            decodedName = decodedName.replace('.js', '');
        }
        return decodedName;
    }
    catch (err) {
        throw err;
    }
};
const generateExposeFilename = (exposeName, withExt) => {
    if (!exposeName) {
        return '';
    }
    let expose = exposeName;
    if (expose === '.') {
        expose = 'default_export';
    }
    if (expose.startsWith('./')) {
        expose = expose.replace('./', '');
    }
    return encodeName(expose, '__federation_expose_', withExt);
};
const generateShareFilename = (pkgName, withExt) => {
    if (!pkgName) {
        return '';
    }
    return encodeName(pkgName, '__federation_shared_', withExt);
};
const getResourceUrl = (module, sourceUrl) => {
    if ('getPublicPath' in module) {
        let publicPath;
        if (!module.getPublicPath.startsWith('function')) {
            publicPath = new Function(module.getPublicPath)();
        }
        else {
            publicPath = new Function('return ' + module.getPublicPath)()();
        }
        return `${publicPath}${sourceUrl}`;
    }
    else if ('publicPath' in module) {
        if (!isBrowserEnv() && !isReactNativeEnv() && 'ssrPublicPath' in module) {
            return `${module.ssrPublicPath}${sourceUrl}`;
        }
        return `${module.publicPath}${sourceUrl}`;
    }
    else {
        console.warn('Cannot get resource URL. If in debug mode, please ignore.', module, sourceUrl);
        return '';
    }
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const assert = (condition, msg) => {
    if (!condition) {
        error(msg);
    }
};
const error = (msg) => {
    throw new Error(`${LOG_CATEGORY}: ${msg}`);
};
const warn = (msg) => {
    console.warn(`${LOG_CATEGORY}: ${msg}`);
};
function safeToString(info) {
    try {
        return JSON.stringify(info, null, 2);
    }
    catch (e) {
        return '';
    }
}
// RegExp for version string
const VERSION_PATTERN_REGEXP = /^([\d^=v<>~]|[*xX]$)/;
function isRequiredVersion(str) {
    return VERSION_PATTERN_REGEXP.test(str);
}

const simpleJoinRemoteEntry = (rPath, rName) => {
    if (!rPath) {
        return rName;
    }
    const transformPath = (str) => {
        if (str === '.') {
            return '';
        }
        if (str.startsWith('./')) {
            return str.replace('./', '');
        }
        if (str.startsWith('/')) {
            const strWithoutSlash = str.slice(1);
            if (strWithoutSlash.endsWith('/')) {
                return strWithoutSlash.slice(0, -1);
            }
            return strWithoutSlash;
        }
        return str;
    };
    const transformedPath = transformPath(rPath);
    if (!transformedPath) {
        return rName;
    }
    if (transformedPath.endsWith('/')) {
        return `${transformedPath}${rName}`;
    }
    return `${transformedPath}/${rName}`;
};
function inferAutoPublicPath(url) {
    return url
        .replace(/#.*$/, '')
        .replace(/\?.*$/, '')
        .replace(/\/[^\/]+$/, '/');
}
// Priority: overrides > remotes
// eslint-disable-next-line max-lines-per-function
function generateSnapshotFromManifest(manifest, options = {}) {
    const { remotes = {}, overrides = {}, version } = options;
    let remoteSnapshot;
    const getPublicPath = () => {
        if ('publicPath' in manifest.metaData) {
            if (manifest.metaData.publicPath === 'auto' && version) {
                // use same implementation as publicPath auto runtime module implements
                return inferAutoPublicPath(version);
            }
            return manifest.metaData.publicPath;
        }
        else {
            return manifest.metaData.getPublicPath;
        }
    };
    const overridesKeys = Object.keys(overrides);
    let remotesInfo = {};
    // If remotes are not provided, only the remotes in the manifest will be read
    if (!Object.keys(remotes).length) {
        remotesInfo =
            manifest.remotes?.reduce((res, next) => {
                let matchedVersion;
                const name = next.federationContainerName;
                // overrides have higher priority
                if (overridesKeys.includes(name)) {
                    matchedVersion = overrides[name];
                }
                else {
                    if ('version' in next) {
                        matchedVersion = next.version;
                    }
                    else {
                        matchedVersion = next.entry;
                    }
                }
                res[name] = {
                    matchedVersion,
                };
                return res;
            }, {}) || {};
    }
    // If remotes (deploy scenario) are specified, they need to be traversed again
    Object.keys(remotes).forEach((key) => (remotesInfo[key] = {
        // overrides will override dependencies
        matchedVersion: overridesKeys.includes(key)
            ? overrides[key]
            : remotes[key],
    }));
    const { remoteEntry: { path: remoteEntryPath, name: remoteEntryName, type: remoteEntryType, }, types: remoteTypes = { path: '', name: '', zip: '', api: '' }, buildInfo: { buildVersion }, globalName, ssrRemoteEntry, } = manifest.metaData;
    const { exposes } = manifest;
    let basicRemoteSnapshot = {
        version: version ? version : '',
        buildVersion,
        globalName,
        remoteEntry: simpleJoinRemoteEntry(remoteEntryPath, remoteEntryName),
        remoteEntryType,
        remoteTypes: simpleJoinRemoteEntry(remoteTypes.path, remoteTypes.name),
        remoteTypesZip: remoteTypes.zip || '',
        remoteTypesAPI: remoteTypes.api || '',
        remotesInfo,
        shared: manifest?.shared.map((item) => ({
            assets: item.assets,
            sharedName: item.name,
            version: item.version,
        })),
        modules: exposes?.map((expose) => ({
            moduleName: expose.name,
            modulePath: expose.path,
            assets: expose.assets,
        })),
    };
    if (manifest.metaData?.prefetchInterface) {
        const prefetchInterface = manifest.metaData.prefetchInterface;
        basicRemoteSnapshot = {
            ...basicRemoteSnapshot,
            prefetchInterface,
        };
    }
    if (manifest.metaData?.prefetchEntry) {
        const { path, name, type } = manifest.metaData.prefetchEntry;
        basicRemoteSnapshot = {
            ...basicRemoteSnapshot,
            prefetchEntry: simpleJoinRemoteEntry(path, name),
            prefetchEntryType: type,
        };
    }
    if ('publicPath' in manifest.metaData) {
        remoteSnapshot = {
            ...basicRemoteSnapshot,
            publicPath: getPublicPath(),
            ssrPublicPath: manifest.metaData.ssrPublicPath,
        };
    }
    else {
        remoteSnapshot = {
            ...basicRemoteSnapshot,
            getPublicPath: getPublicPath(),
        };
    }
    if (ssrRemoteEntry) {
        const fullSSRRemoteEntry = simpleJoinRemoteEntry(ssrRemoteEntry.path, ssrRemoteEntry.name);
        remoteSnapshot.ssrRemoteEntry = fullSSRRemoteEntry;
        remoteSnapshot.ssrRemoteEntryType =
            ssrRemoteEntry.type || 'commonjs-module';
    }
    return remoteSnapshot;
}
function isManifestProvider(moduleInfo) {
    if ('remoteEntry' in moduleInfo &&
        moduleInfo.remoteEntry.includes(MANIFEST_EXT)) {
        return true;
    }
    else {
        return false;
    }
}
function getManifestFileName(manifestOptions) {
    if (!manifestOptions) {
        return {
            statsFileName: StatsFileName,
            manifestFileName: ManifestFileName,
        };
    }
    let filePath = typeof manifestOptions === 'boolean' ? '' : manifestOptions.filePath || '';
    let fileName = typeof manifestOptions === 'boolean' ? '' : manifestOptions.fileName || '';
    const JSON_EXT = '.json';
    const addExt = (name) => {
        if (name.endsWith(JSON_EXT)) {
            return name;
        }
        return `${name}${JSON_EXT}`;
    };
    const insertSuffix = (name, suffix) => {
        return name.replace(JSON_EXT, `${suffix}${JSON_EXT}`);
    };
    const manifestFileName = fileName ? addExt(fileName) : ManifestFileName;
    const statsFileName = fileName
        ? insertSuffix(manifestFileName, '-stats')
        : StatsFileName;
    return {
        statsFileName: simpleJoinRemoteEntry(filePath, statsFileName),
        manifestFileName: simpleJoinRemoteEntry(filePath, manifestFileName),
    };
}

const PREFIX = '[ Module Federation ]';
const DEFAULT_DELEGATE = console;
const LOGGER_STACK_SKIP_TOKENS = [
    'logger.ts',
    'logger.js',
    'captureStackTrace',
    'Logger.emit',
    'Logger.log',
    'Logger.info',
    'Logger.warn',
    'Logger.error',
    'Logger.debug',
];
function captureStackTrace() {
    try {
        const stack = new Error().stack;
        if (!stack) {
            return undefined;
        }
        const [, ...rawLines] = stack.split('\n');
        const filtered = rawLines.filter((line) => !LOGGER_STACK_SKIP_TOKENS.some((token) => line.includes(token)));
        if (!filtered.length) {
            return undefined;
        }
        const stackPreview = filtered.slice(0, 5).join('\n');
        return `Stack trace:\n${stackPreview}`;
    }
    catch {
        return undefined;
    }
}
class Logger {
    constructor(prefix, delegate = DEFAULT_DELEGATE) {
        this.prefix = prefix;
        this.delegate = delegate ?? DEFAULT_DELEGATE;
    }
    setPrefix(prefix) {
        this.prefix = prefix;
    }
    setDelegate(delegate) {
        this.delegate = delegate ?? DEFAULT_DELEGATE;
    }
    emit(method, args) {
        const delegate = this.delegate;
        const debugMode = isDebugMode();
        const stackTrace = debugMode ? captureStackTrace() : undefined;
        const enrichedArgs = stackTrace ? [...args, stackTrace] : args;
        const order = (() => {
            switch (method) {
                case 'log':
                    return ['log', 'info'];
                case 'info':
                    return ['info', 'log'];
                case 'warn':
                    return ['warn', 'info', 'log'];
                case 'error':
                    return ['error', 'warn', 'log'];
                case 'debug':
                default:
                    return ['debug', 'log'];
            }
        })();
        for (const candidate of order) {
            const handler = delegate[candidate];
            if (typeof handler === 'function') {
                handler.call(delegate, this.prefix, ...enrichedArgs);
                return;
            }
        }
        for (const candidate of order) {
            const handler = DEFAULT_DELEGATE[candidate];
            if (typeof handler === 'function') {
                handler.call(DEFAULT_DELEGATE, this.prefix, ...enrichedArgs);
                return;
            }
        }
    }
    log(...args) {
        this.emit('log', args);
    }
    warn(...args) {
        this.emit('warn', args);
    }
    error(...args) {
        this.emit('error', args);
    }
    success(...args) {
        this.emit('info', args);
    }
    info(...args) {
        this.emit('info', args);
    }
    ready(...args) {
        this.emit('info', args);
    }
    debug(...args) {
        if (isDebugMode()) {
            this.emit('debug', args);
        }
    }
}
function createLogger(prefix) {
    return new Logger(prefix);
}
function createInfrastructureLogger(prefix) {
    const infrastructureLogger = new Logger(prefix);
    Object.defineProperty(infrastructureLogger, '__mf_infrastructure_logger__', {
        value: true,
        enumerable: false,
        configurable: false,
    });
    return infrastructureLogger;
}
function bindLoggerToCompiler(loggerInstance, compiler, name) {
    if (!loggerInstance
        .__mf_infrastructure_logger__) {
        return;
    }
    if (!compiler?.getInfrastructureLogger) {
        return;
    }
    try {
        const infrastructureLogger = compiler.getInfrastructureLogger(name);
        if (infrastructureLogger &&
            typeof infrastructureLogger === 'object' &&
            (typeof infrastructureLogger.log === 'function' ||
                typeof infrastructureLogger.info === 'function' ||
                typeof infrastructureLogger.warn === 'function' ||
                typeof infrastructureLogger.error === 'function')) {
            loggerInstance.setDelegate(infrastructureLogger);
        }
    }
    catch {
        // If the bundler throws (older versions), fall back to default console logger.
        loggerInstance.setDelegate(undefined);
    }
}
const logger = createLogger(PREFIX);
const infrastructureLogger = createInfrastructureLogger(PREFIX);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeWrapper(callback, disableWarn) {
    try {
        const res = await callback();
        return res;
    }
    catch (e) {
        !disableWarn && warn(e);
        return;
    }
}
function isStaticResourcesEqual(url1, url2) {
    const REG_EXP = /^(https?:)?\/\//i;
    // Transform url1 and url2 into relative paths
    const relativeUrl1 = url1.replace(REG_EXP, '').replace(/\/$/, '');
    const relativeUrl2 = url2.replace(REG_EXP, '').replace(/\/$/, '');
    // Check if the relative paths are identical
    return relativeUrl1 === relativeUrl2;
}
function createScript(info) {
    // Retrieve the existing script element by its src attribute
    let script = null;
    let needAttach = true;
    let timeout = 20000;
    let timeoutId;
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        const scriptSrc = s.getAttribute('src');
        if (scriptSrc && isStaticResourcesEqual(scriptSrc, info.url)) {
            script = s;
            needAttach = false;
            break;
        }
    }
    if (!script) {
        const attrs = info.attrs;
        script = document.createElement('script');
        script.type = attrs?.['type'] === 'module' ? 'module' : 'text/javascript';
        let createScriptRes = undefined;
        if (info.createScriptHook) {
            createScriptRes = info.createScriptHook(info.url, info.attrs);
            if (createScriptRes instanceof HTMLScriptElement) {
                script = createScriptRes;
            }
            else if (typeof createScriptRes === 'object') {
                if ('script' in createScriptRes && createScriptRes.script) {
                    script = createScriptRes.script;
                }
                if ('timeout' in createScriptRes && createScriptRes.timeout) {
                    timeout = createScriptRes.timeout;
                }
            }
        }
        if (!script.src) {
            script.src = info.url;
        }
        if (attrs && !createScriptRes) {
            Object.keys(attrs).forEach((name) => {
                if (script) {
                    if (name === 'async' || name === 'defer') {
                        script[name] = attrs[name];
                        // Attributes that do not exist are considered overridden
                    }
                    else if (!script.getAttribute(name)) {
                        script.setAttribute(name, attrs[name]);
                    }
                }
            });
        }
    }
    const onScriptComplete = async (prev, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event) => {
        clearTimeout(timeoutId);
        const onScriptCompleteCallback = () => {
            if (event?.type === 'error') {
                info?.onErrorCallback && info?.onErrorCallback(event);
            }
            else {
                info?.cb && info?.cb();
            }
        };
        // Prevent memory leaks in IE.
        if (script) {
            script.onerror = null;
            script.onload = null;
            safeWrapper(() => {
                const { needDeleteScript = true } = info;
                if (needDeleteScript) {
                    script?.parentNode && script.parentNode.removeChild(script);
                }
            });
            if (prev && typeof prev === 'function') {
                const result = prev(event);
                if (result instanceof Promise) {
                    const res = await result;
                    onScriptCompleteCallback();
                    return res;
                }
                onScriptCompleteCallback();
                return result;
            }
        }
        onScriptCompleteCallback();
    };
    script.onerror = onScriptComplete.bind(null, script.onerror);
    script.onload = onScriptComplete.bind(null, script.onload);
    timeoutId = setTimeout(() => {
        onScriptComplete(null, new Error(`Remote script "${info.url}" time-outed.`));
    }, timeout);
    return { script, needAttach };
}
function createLink(info) {
    // <link rel="preload" href="script.js" as="script">
    // Retrieve the existing script element by its src attribute
    let link = null;
    let needAttach = true;
    const links = document.getElementsByTagName('link');
    for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const linkHref = l.getAttribute('href');
        const linkRel = l.getAttribute('rel');
        if (linkHref &&
            isStaticResourcesEqual(linkHref, info.url) &&
            linkRel === info.attrs['rel']) {
            link = l;
            needAttach = false;
            break;
        }
    }
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('href', info.url);
        let createLinkRes = undefined;
        const attrs = info.attrs;
        if (info.createLinkHook) {
            createLinkRes = info.createLinkHook(info.url, attrs);
            if (createLinkRes instanceof HTMLLinkElement) {
                link = createLinkRes;
            }
        }
        if (attrs && !createLinkRes) {
            Object.keys(attrs).forEach((name) => {
                if (link && !link.getAttribute(name)) {
                    link.setAttribute(name, attrs[name]);
                }
            });
        }
    }
    const onLinkComplete = (prev, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event) => {
        const onLinkCompleteCallback = () => {
            if (event?.type === 'error') {
                info?.onErrorCallback && info?.onErrorCallback(event);
            }
            else {
                info?.cb && info?.cb();
            }
        };
        // Prevent memory leaks in IE.
        if (link) {
            link.onerror = null;
            link.onload = null;
            safeWrapper(() => {
                const { needDeleteLink = true } = info;
                if (needDeleteLink) {
                    link?.parentNode && link.parentNode.removeChild(link);
                }
            });
            if (prev) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const res = prev(event);
                onLinkCompleteCallback();
                return res;
            }
        }
        onLinkCompleteCallback();
    };
    link.onerror = onLinkComplete.bind(null, link.onerror);
    link.onload = onLinkComplete.bind(null, link.onload);
    return { link, needAttach };
}
function loadScript(url, info) {
    const { attrs = {}, createScriptHook } = info;
    return new Promise((resolve, reject) => {
        const { script, needAttach } = createScript({
            url,
            cb: resolve,
            onErrorCallback: reject,
            attrs: {
                fetchpriority: 'high',
                ...attrs,
            },
            createScriptHook,
            needDeleteScript: true,
        });
        needAttach && document.head.appendChild(script);
    });
}

const sdkImportCache = new Map();
function importNodeModule(name) {
    if (!name) {
        throw new Error('import specifier is required');
    }
    // Check cache to prevent infinite recursion
    if (sdkImportCache.has(name)) {
        return sdkImportCache.get(name);
    }
    const importModule = new Function('name', `return import(name)`);
    const promise = importModule(name)
        .then((res) => res)
        .catch((error) => {
        console.error(`Error importing module ${name}:`, error);
        // Remove from cache on error so it can be retried
        sdkImportCache.delete(name);
        throw error;
    });
    // Cache the promise to prevent recursive calls
    sdkImportCache.set(name, promise);
    return promise;
}
const loadNodeFetch = async () => {
    const fetchModule = await importNodeModule('node-fetch');
    return (fetchModule.default || fetchModule);
};
const lazyLoaderHookFetch = async (input, init, loaderHook) => {
    const hook = (url, init) => {
        return loaderHook.lifecycle.fetch.emit(url, init);
    };
    const res = await hook(input, init || {});
    if (!res || !(res instanceof Response)) {
        const fetchFunction = typeof fetch === 'undefined' ? await loadNodeFetch() : fetch;
        return fetchFunction(input, init || {});
    }
    return res;
};
const createScriptNode = typeof ENV_TARGET === 'undefined' || ENV_TARGET !== 'web'
    ? (url, cb, attrs, loaderHook) => {
        if (loaderHook?.createScriptHook) {
            const hookResult = loaderHook.createScriptHook(url);
            if (hookResult &&
                typeof hookResult === 'object' &&
                'url' in hookResult) {
                url = hookResult.url;
            }
        }
        let urlObj;
        try {
            urlObj = new URL(url);
        }
        catch (e) {
            console.error('Error constructing URL:', e);
            cb(new Error(`Invalid URL: ${e}`));
            return;
        }
        const getFetch = async () => {
            if (loaderHook?.fetch) {
                return (input, init) => lazyLoaderHookFetch(input, init, loaderHook);
            }
            return typeof fetch === 'undefined' ? loadNodeFetch() : fetch;
        };
        const handleScriptFetch = async (f, urlObj) => {
            try {
                const res = await f(urlObj.href);
                const data = await res.text();
                const [path, vm] = await Promise.all([
                    importNodeModule('path'),
                    importNodeModule('vm'),
                ]);
                const scriptContext = { exports: {}, module: { exports: {} } };
                const urlDirname = urlObj.pathname
                    .split('/')
                    .slice(0, -1)
                    .join('/');
                const filename = path.basename(urlObj.pathname);
                const script = new vm.Script(`(function(exports, module, require, __dirname, __filename) {${data}\n})`, {
                    filename,
                    importModuleDynamically: 
                    //@ts-ignore
                    vm.constants?.USE_MAIN_CONTEXT_DEFAULT_LOADER ??
                        importNodeModule,
                });
                script.runInThisContext()(scriptContext.exports, scriptContext.module, eval('require'), urlDirname, filename);
                const exportedInterface = scriptContext.module.exports || scriptContext.exports;
                if (attrs && exportedInterface && attrs['globalName']) {
                    const container = exportedInterface[attrs['globalName']] || exportedInterface;
                    cb(undefined, container);
                    return;
                }
                cb(undefined, exportedInterface);
            }
            catch (e) {
                cb(e instanceof Error
                    ? e
                    : new Error(`Script execution error: ${e}`));
            }
        };
        getFetch()
            .then(async (f) => {
            if (attrs?.['type'] === 'esm' || attrs?.['type'] === 'module') {
                return loadModule(urlObj.href, {
                    fetch: f,
                    vm: await importNodeModule('vm'),
                })
                    .then(async (module) => {
                    await module.evaluate();
                    cb(undefined, module.namespace);
                })
                    .catch((e) => {
                    cb(e instanceof Error
                        ? e
                        : new Error(`Script execution error: ${e}`));
                });
            }
            handleScriptFetch(f, urlObj);
        })
            .catch((err) => {
            cb(err);
        });
    }
    : (url, cb, attrs, loaderHook) => {
        cb(new Error('createScriptNode is disabled in non-Node.js environment'));
    };
const loadScriptNode = typeof ENV_TARGET === 'undefined' || ENV_TARGET !== 'web'
    ? (url, info) => {
        return new Promise((resolve, reject) => {
            createScriptNode(url, (error, scriptContext) => {
                if (error) {
                    reject(error);
                }
                else {
                    const remoteEntryKey = info?.attrs?.['globalName'] ||
                        `__FEDERATION_${info?.attrs?.['name']}:custom__`;
                    const entryExports = (globalThis[remoteEntryKey] =
                        scriptContext);
                    resolve(entryExports);
                }
            }, info.attrs, info.loaderHook);
        });
    }
    : (url, info) => {
        throw new Error('loadScriptNode is disabled in non-Node.js environment');
    };
const esmModuleCache = new Map();
async function loadModule(url, options) {
    // Check cache to prevent infinite recursion in ESM loading
    if (esmModuleCache.has(url)) {
        return esmModuleCache.get(url);
    }
    const { fetch, vm } = options;
    const response = await fetch(url);
    const code = await response.text();
    const module = new vm.SourceTextModule(code, {
        // @ts-ignore
        importModuleDynamically: async (specifier, script) => {
            const resolvedUrl = new URL(specifier, url).href;
            return loadModule(resolvedUrl, options);
        },
    });
    // Cache the module before linking to prevent cycles
    esmModuleCache.set(url, module);
    await module.link(async (specifier) => {
        const resolvedUrl = new URL(specifier, url).href;
        const module = await loadModule(resolvedUrl, options);
        return module;
    });
    return module;
}

function normalizeOptions(enableDefault, defaultOptions, key) {
    return function (options) {
        if (options === false) {
            return false;
        }
        if (typeof options === 'undefined') {
            if (enableDefault) {
                return defaultOptions;
            }
            else {
                return false;
            }
        }
        if (options === true) {
            return defaultOptions;
        }
        if (options && typeof options === 'object') {
            return {
                ...defaultOptions,
                ...options,
            };
        }
        throw new Error(`Unexpected type for \`${key}\`, expect boolean/undefined/object, got: ${typeof options}`);
    };
}

const createModuleFederationConfig = (options) => {
    return options;
};

export { BROWSER_LOG_KEY, ENCODE_NAME_PREFIX, EncodedNameTransformMap, FederationModuleManifest, MANIFEST_EXT, MFModuleType, MFPrefetchCommon, MODULE_DEVTOOL_IDENTIFIER, ManifestFileName, NameTransformMap, NameTransformSymbol, SEPARATOR, StatsFileName, TEMP_DIR, assert, bindLoggerToCompiler, composeKeyWithSeparator, ContainerPlugin as containerPlugin, ContainerReferencePlugin as containerReferencePlugin, createInfrastructureLogger, createLink, createLogger, createModuleFederationConfig, createScript, createScriptNode, decodeName, encodeName, error, generateExposeFilename, generateShareFilename, generateSnapshotFromManifest, getManifestFileName, getProcessEnv, getResourceUrl, inferAutoPublicPath, infrastructureLogger, isBrowserEnv, isDebugMode, isManifestProvider, isReactNativeEnv, isRequiredVersion, isStaticResourcesEqual, loadScript, loadScriptNode, logger, ModuleFederationPlugin as moduleFederationPlugin, normalizeOptions, parseEntry, safeToString, safeWrapper, SharePlugin as sharePlugin, simpleJoinRemoteEntry, warn };
//# sourceMappingURL=index.esm.js.map
