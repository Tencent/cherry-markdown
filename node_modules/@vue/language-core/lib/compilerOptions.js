"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilerOptionsResolver = void 0;
exports.createParsedCommandLineByJson = createParsedCommandLineByJson;
exports.createParsedCommandLine = createParsedCommandLine;
exports.getDefaultCompilerOptions = getDefaultCompilerOptions;
const shared_1 = require("@vue/shared");
const path_browserify_1 = require("path-browserify");
const shared_2 = require("./utils/shared");
function createParsedCommandLineByJson(ts, host, rootDir, json, configFileName) {
    const extendedPaths = new Set();
    const proxyHost = {
        ...host,
        readFile(fileName) {
            if (!fileName.endsWith('/package.json')) {
                extendedPaths.add(fileName);
            }
            return host.readFile(fileName);
        },
        readDirectory() {
            return [];
        },
    };
    const config = ts.readJsonConfigFile(rootDir, () => JSON.stringify(json));
    const parsed = ts.parseJsonSourceFileConfigFileContent(config, proxyHost, rootDir, {}, configFileName);
    const resolver = new CompilerOptionsResolver(ts, host.readFile);
    for (const extendPath of [...extendedPaths].reverse()) {
        try {
            const configFile = ts.readJsonConfigFile(extendPath, host.readFile);
            const obj = ts.convertToObject(configFile, []);
            const rawOptions = obj?.vueCompilerOptions ?? {};
            resolver.addConfig(rawOptions, path_browserify_1.posix.dirname(configFile.fileName));
        }
        catch { }
    }
    resolver.addConfig(json?.vueCompilerOptions ?? {}, rootDir);
    return {
        ...parsed,
        vueOptions: resolver.build(),
    };
}
function createParsedCommandLine(ts, host, configFileName) {
    try {
        const extendedPaths = new Set();
        const proxyHost = {
            ...host,
            readFile(fileName) {
                if (!fileName.endsWith('/package.json')) {
                    extendedPaths.add(fileName);
                }
                return host.readFile(fileName);
            },
            readDirectory() {
                return [];
            },
        };
        const config = ts.readJsonConfigFile(configFileName, proxyHost.readFile);
        const parsed = ts.parseJsonSourceFileConfigFileContent(config, proxyHost, path_browserify_1.posix.dirname(configFileName), {}, configFileName);
        const resolver = new CompilerOptionsResolver(ts, host.readFile);
        for (const extendPath of [...extendedPaths].reverse()) {
            try {
                const configFile = ts.readJsonConfigFile(extendPath, host.readFile);
                const obj = ts.convertToObject(configFile, []);
                const rawOptions = obj?.vueCompilerOptions ?? {};
                resolver.addConfig(rawOptions, path_browserify_1.posix.dirname(configFile.fileName));
            }
            catch { }
        }
        return {
            ...parsed,
            vueOptions: resolver.build(),
        };
    }
    catch { }
    return {
        options: {},
        errors: [],
        vueOptions: getDefaultCompilerOptions(),
    };
}
class CompilerOptionsResolver {
    ts;
    readFile;
    options = {};
    target;
    typesRoot;
    plugins = [];
    constructor(ts, readFile) {
        this.ts = ts;
        this.readFile = readFile;
    }
    addConfig(options, rootDir) {
        for (const key in options) {
            switch (key) {
                case 'target':
                    if (options[key] === 'auto') {
                        this.target = this.resolveVueVersion(rootDir);
                    }
                    else {
                        this.target = options[key];
                    }
                    break;
                case 'strictTemplates':
                    const strict = !!options.strictTemplates;
                    this.options.strictVModel ??= strict;
                    this.options.checkUnknownProps ??= strict;
                    this.options.checkUnknownEvents ??= strict;
                    this.options.checkUnknownDirectives ??= strict;
                    this.options.checkUnknownComponents ??= strict;
                    break;
                case 'typesRoot':
                    if (options[key] !== undefined) {
                        if (path_browserify_1.posix.isAbsolute(options[key])) {
                            this.typesRoot = options[key];
                        }
                        else {
                            this.typesRoot = path_browserify_1.posix.join(rootDir, options[key]);
                        }
                    }
                    break;
                case 'plugins':
                    this.plugins = (options.plugins ?? [])
                        .flatMap((pluginPath) => {
                        try {
                            const resolve = require?.resolve;
                            const resolvedPath = resolve?.(pluginPath, { paths: [rootDir] });
                            if (resolvedPath) {
                                const plugin = require(resolvedPath);
                                plugin.__moduleName = pluginPath;
                                return plugin;
                            }
                            else {
                                console.warn('[Vue] Load plugin failed:', pluginPath);
                            }
                        }
                        catch (error) {
                            console.warn('[Vue] Resolve plugin path failed:', pluginPath, error);
                        }
                        return [];
                    });
                    break;
                default:
                    // @ts-expect-error
                    this.options[key] = options[key];
                    break;
            }
        }
        if (options.target === undefined) {
            this.target ??= this.resolveVueVersion(rootDir);
        }
    }
    build(defaults = getDefaultCompilerOptions(this.target, this.options.lib, undefined, this.typesRoot)) {
        const resolvedOptions = {
            ...defaults,
            ...this.options,
            plugins: this.plugins,
            macros: {
                ...defaults.macros,
                ...this.options.macros,
            },
            composables: {
                ...defaults.composables,
                ...this.options.composables,
            },
            fallthroughComponentNames: [
                ...defaults.fallthroughComponentNames,
                ...this.options.fallthroughComponentNames ?? [],
            ].map(shared_2.hyphenateTag),
            // https://github.com/vuejs/core/blob/master/packages/compiler-dom/src/transforms/vModel.ts#L49-L51
            // https://vuejs.org/guide/essentials/forms.html#form-input-bindings
            experimentalModelPropName: Object.fromEntries(Object.entries(this.options.experimentalModelPropName ?? defaults.experimentalModelPropName).map(([k, v]) => [(0, shared_1.camelize)(k), v])),
        };
        return resolvedOptions;
    }
    resolveVueVersion(folder) {
        const packageJsonPath = this.ts.findConfigFile(folder, fileName => this.readFile(fileName) !== undefined, 'node_modules/vue/package.json');
        if (!packageJsonPath) {
            return;
        }
        const packageJsonContent = this.readFile(packageJsonPath);
        if (!packageJsonContent) {
            return;
        }
        const packageJson = JSON.parse(packageJsonContent);
        const version = packageJson.version;
        const [majorVersion, minorVersion] = version.split('.');
        return Number(majorVersion + '.' + minorVersion);
    }
}
exports.CompilerOptionsResolver = CompilerOptionsResolver;
function getDefaultCompilerOptions(target = 99, lib = 'vue', strictTemplates = false, typesRoot = typeof __dirname !== 'undefined'
    ? path_browserify_1.posix.join(__dirname.replace(/\\/g, '/'), '..', 'types')
    : '@vue/language-core/types') {
    return {
        target,
        lib,
        typesRoot,
        extensions: ['.vue'],
        vitePressExtensions: [],
        petiteVueExtensions: [],
        jsxSlots: false,
        strictCssModules: false,
        strictVModel: strictTemplates,
        checkUnknownProps: strictTemplates,
        checkUnknownEvents: strictTemplates,
        checkUnknownDirectives: strictTemplates,
        checkUnknownComponents: strictTemplates,
        inferComponentDollarEl: false,
        inferComponentDollarRefs: false,
        inferTemplateDollarAttrs: false,
        inferTemplateDollarEl: false,
        inferTemplateDollarRefs: false,
        inferTemplateDollarSlots: false,
        skipTemplateCodegen: false,
        fallthroughAttributes: false,
        resolveStyleImports: false,
        resolveStyleClassNames: 'scoped',
        fallthroughComponentNames: [
            'Transition',
            'KeepAlive',
            'Teleport',
            'Suspense',
        ],
        dataAttributes: [],
        htmlAttributes: ['aria-*'],
        optionsWrapper: [`(await import('${lib}')).defineComponent(`, `)`],
        macros: {
            defineProps: ['defineProps'],
            defineSlots: ['defineSlots'],
            defineEmits: ['defineEmits'],
            defineExpose: ['defineExpose'],
            defineModel: ['defineModel'],
            defineOptions: ['defineOptions'],
            withDefaults: ['withDefaults'],
        },
        composables: {
            useAttrs: ['useAttrs'],
            useCssModule: ['useCssModule'],
            useSlots: ['useSlots'],
            useTemplateRef: ['useTemplateRef', 'templateRef'],
        },
        plugins: [],
        experimentalModelPropName: {
            '': {
                input: true,
            },
            value: {
                input: { type: 'text' },
                textarea: true,
                select: true,
            },
        },
    };
}
//# sourceMappingURL=compilerOptions.js.map