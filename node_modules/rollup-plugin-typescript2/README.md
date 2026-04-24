# rollup-plugin-typescript2

[![npm-version](https://img.shields.io/npm/v/rollup-plugin-typescript2.svg?maxAge=259200)](https://npmjs.org/package/rollup-plugin-typescript2)
[![npm-monthly-downloads](https://img.shields.io/npm/dm/rollup-plugin-typescript2.svg?maxAge=259200)](https://npmjs.org/package/rollup-plugin-typescript2)
[![Node.js CI](https://github.com/ezolenko/rollup-plugin-typescript2/workflows/Node.js%20CI/badge.svg)](https://github.com/ezolenko/rollup-plugin-typescript2/actions?query=workflow%3A"Node.js+CI")

Rollup plugin for typescript with compiler errors.

This is a rewrite of the [original](https://github.com/rollup/rollup-plugin-typescript/tree/v0.8.1) `rollup-plugin-typescript`, starting and borrowing from [this fork](https://github.com/alexlur/rollup-plugin-typescript).

This version is somewhat slower than the original, but it will print out TypeScript syntactic and semantic diagnostic messages (the main reason for using TypeScript after all).

## Installation

```bash
# with npm
npm install rollup-plugin-typescript2 typescript tslib --save-dev
# with yarn
yarn add rollup-plugin-typescript2 typescript tslib --dev
```

## Usage

```js
// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default {
	input: './main.ts',

	plugins: [
		typescript(/*{ plugin options }*/)
	]
}
```

This plugin inherits all compiler options and file lists from your `tsconfig.json` file.
If your `tsconfig` has another name or another relative path from the root directory, see `tsconfigDefaults`, `tsconfig`, and `tsconfigOverride` options below.
This also allows for passing in different `tsconfig` files depending on your build target.

### Some compiler options are forced

* `noEmitHelpers`: false
* `importHelpers`: true
* `noResolve`: false
* `noEmit`: false (Rollup controls emit)
* `noEmitOnError`: false (Rollup controls emit. See [#254](https://github.com/ezolenko/rollup-plugin-typescript2/issues/254) and the `abortOnError` plugin option below)
* `inlineSourceMap`: false (see [#71](https://github.com/ezolenko/rollup-plugin-typescript2/issues/71))
* `outDir`: `./placeholder` in cache root (see [#83](https://github.com/ezolenko/rollup-plugin-typescript2/issues/83) and [Microsoft/TypeScript#24715](https://github.com/Microsoft/TypeScript/issues/24715))
* `declarationDir`: Rollup's `output.file` or `output.dir` (*unless `useTsconfigDeclarationDir` is true in the plugin options*)
* `allowNonTsExtensions`: true to let other plugins on the chain generate typescript; update plugin's `include` filter to pick them up (see [#111](https://github.com/ezolenko/rollup-plugin-typescript2/issues/111))

### Some compiler options have more than one compatible value

* `module`: defaults to `ES2015`. Other valid values are `ES2020`, `ES2022` and `ESNext` (required for dynamic imports, see [#54](https://github.com/ezolenko/rollup-plugin-typescript2/issues/54)).

* `moduleResolution`: defaults to `node10` (same as `node`), but value from tsconfig is used if specified. Other valid (but mostly untested) values are `node16`, `nodenext` and `bundler`. If in doubt, use `node10`.
	* `classic` is [deprecated](https://www.typescriptlang.org/docs/handbook/module-resolution.html) and changed to `node10`. It also breaks this plugin, see [#12](https://github.com/ezolenko/rollup-plugin-typescript2/issues/12) and [#14](https://github.com/ezolenko/rollup-plugin-typescript2/issues/14).

### Some options need additional configuration on plugin side

* `allowJs`: lets TypeScript process JS files as well. If you use it, modify this plugin's `include` option to add `"*.js+(|x)", "**/*.js+(|x)"` (might also want to `exclude` `"**/node_modules/**/*"`, as it can slow down the build significantly).

### Compatibility

#### @rollup/plugin-node-resolve

Must be before `rollup-plugin-typescript2` in the plugin list, especially when the `browser: true` option is used (see [#66](https://github.com/ezolenko/rollup-plugin-typescript2/issues/66)).

#### @rollup/plugin-commonjs

See the explanation for `rollupCommonJSResolveHack` option below.

#### @rollup/plugin-babel

This plugin transpiles code, but doesn't change file extensions. `@rollup/plugin-babel` only looks at code with these extensions [by default](https://github.com/rollup/plugins/tree/master/packages/babel#extensions): `.js,.jsx,.es6,.es,.mjs`. To workaround this, add `.ts` and `.tsx` to its list of extensions.

```js
// ...
import { DEFAULT_EXTENSIONS } from '@babel/core';
// ...
	babel({
		extensions: [
			...DEFAULT_EXTENSIONS,
			'.ts',
			'.tsx'
		]
	}),
// ...
```

See [#108](https://github.com/ezolenko/rollup-plugin-typescript2/issues/108)

### Plugin options

* `cwd`: `string`

	The current working directory. Defaults to `process.cwd()`.

* `tsconfigDefaults`: `{}`

	The object passed as `tsconfigDefaults` will be merged with the loaded `tsconfig.json`.
	The final config passed to TypeScript will be the result of values in `tsconfigDefaults` replaced by values in the loaded `tsconfig.json`, replaced by values in `tsconfigOverride`, and then replaced by forced `compilerOptions` overrides on top of that (see above).

	For simplicity and other tools' sake, try to minimize the usage of defaults and overrides and keep everything in a `tsconfig.json` file (`tsconfig`s can themselves be chained with [`extends`](https://www.typescriptlang.org/tsconfig#extends), so save some turtles).

	```js
	let defaults = { compilerOptions: { declaration: true } };
	let override = { compilerOptions: { declaration: false } };

	// ...
	plugins: [
		typescript({
			tsconfigDefaults: defaults,
			tsconfig: "tsconfig.json",
			tsconfigOverride: override
		})
	]
	```

	This is a [deep merge](https://lodash.com/docs/4.17.4#merge): objects are merged, arrays are merged by index, primitives are replaced, etc.
	Increase `verbosity` to `3` and look for `parsed tsconfig` if you get something unexpected.

* `tsconfig`: `undefined`

	Path to `tsconfig.json`.
	Set this if your `tsconfig` has another name or relative location from the project directory.

	By default, will try to load `./tsconfig.json`, but will not fail if the file is missing, unless the value is explicitly set.

* `tsconfigOverride`: `{}`

	See `tsconfigDefaults`.

* `check`: true

	Set to false to avoid doing any diagnostic checks on the code.
	Setting to false is sometimes referred to as `transpileOnly` by other TypeScript integrations.

* `verbosity`: 1

	- 0 -- Error
	- 1 -- Warning
	- 2 -- Info
	- 3 -- Debug

* `clean`: false

	Set to true to disable the cache and do a clean build.
	This also wipes any existing cache.

* `cacheRoot`: `node_modules/.cache/rollup-plugin-typescript2`

	Path to cache.
	Defaults to a folder in `node_modules`.

* `include`: `[ "*.ts+(|x)", "**/*.ts+(|x)", "**/*.cts", "**/*.mts" ]`

	By default compiles all `.ts` and `.tsx` files with TypeScript.

* `exclude`: `[ "*.d.ts", "**/*.d.ts", "**/*.d.cts", "**/*.d.mts" ]`

	But excludes type definitions.

* `abortOnError`: true

	Bail out on first syntactic or semantic error.
	In some cases, setting this to false will result in an exception in Rollup itself (for example, unresolvable imports).

* `rollupCommonJSResolveHack`: false

	_Deprecated_. OS native paths are now _always_ used since [`0.30.0`](https://github.com/ezolenko/rollup-plugin-typescript2/releases/0.30.0) (see [#251](https://github.com/ezolenko/rollup-plugin-typescript2/pull/251)), so this no longer has any effect -- as if it is always `true`.

* `objectHashIgnoreUnknownHack`: false

	The plugin uses your Rollup config as part of its cache key.
	`object-hash` is used to generate a hash, but it can have trouble with some uncommon types of elements.
	Setting this option to true will make `object-hash` ignore unknowns, at the cost of not invalidating the cache if ignored elements are changed.

	Only enable this option if you need it (e.g. if you get `Error: Unknown object type "xxx"`) and make sure to run with `clean: true` once in a while and definitely before a release.
	(See [#105](https://github.com/ezolenko/rollup-plugin-typescript2/issues/105) and [#203](https://github.com/ezolenko/rollup-plugin-typescript2/pull/203))

* `useTsconfigDeclarationDir`: false

	If true, declaration files will be emitted in the [`declarationDir`](https://www.typescriptlang.org/tsconfig#declarationDir) given in the `tsconfig`.
	If false, declaration files will be placed inside the destination directory given in the Rollup configuration.

	Set to false if any other Rollup plugins need access to declaration files.

* `typescript`: peerDependency

	If you'd like to use a different version of TS than the peerDependency, you can import a different TypeScript module and pass it in as `typescript: require("path/to/other/typescript")`.

	You can also use an alternative TypeScript implementation, such as [`ttypescript`](https://github.com/cevek/ttypescript), with this option.

	Must be TS 2.0+; things might break if the compiler interfaces changed enough from what the plugin was built against.

* `transformers`: `undefined`

	**experimental**, TypeScript 2.4.1+

	Transformers will likely be available in `tsconfig` eventually, so this is not a stable interface (see [Microsoft/TypeScript#14419](https://github.com/Microsoft/TypeScript/issues/14419)).

	For example, integrating [kimamula/ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys):

	```js
	const keysTransformer = require('ts-transformer-keys/transformer').default;
	const transformer = (service) => ({
  		before: [ keysTransformer(service.getProgram()) ],
  		after: []
	});

	// ...
	plugins: [
		typescript({ transformers: [transformer] })
	]
	```

### Declarations

This plugin respects [`declaration: true`](https://www.typescriptlang.org/tsconfig#declaration) in your `tsconfig.json` file.
When set, it will emit `*.d.ts` files for your bundle.
The resulting file(s) can then be used with the `types` property in your `package.json` file as described [here](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html).<br />
By default, the declaration files will be located in the same directory as the generated Rollup bundle.
If you want to override this behavior and instead use [`declarationDir`](https://www.typescriptlang.org/tsconfig#declarationDir), set `useTsconfigDeclarationDir: true` in the plugin options.

The above also applies to [`declarationMap: true`](https://www.typescriptlang.org/tsconfig#declarationMap) and `*.d.ts.map` files for your bundle.

This plugin also respects [`emitDeclarationOnly: true`](https://www.typescriptlang.org/tsconfig#emitDeclarationOnly) and will only emit declarations (and declaration maps, if enabled) if set in your `tsconfig.json`.
If you use `emitDeclarationOnly`, you will need another plugin to compile any TypeScript sources, such as `@rollup/plugin-babel`, `rollup-plugin-esbuild`, `rollup-plugin-swc`, etc.
When composing Rollup plugins this way, `rollup-plugin-typescript2` will perform type-checking and declaration generation, while another plugin performs the TypeScript to JavaScript compilation.<br />
Some scenarios where this can be particularly useful: you want to use Babel plugins on TypeScript source, or you want declarations and type-checking for your Vite builds (**NOTE**: this space has not been fully explored yet).

### Watch mode

The way TypeScript handles type-only imports and ambient types effectively hides them from Rollup's watch mode, because import statements are not generated and changing them doesn't trigger a rebuild.

Otherwise the plugin should work in watch mode. Make sure to run a normal build after watch session to catch any type errors.

### Requirements

* TypeScript `2.4+`
* Rollup `1.26.3+`
* Node `6.4.0+` (basic ES6 support)

### Reporting bugs and Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
