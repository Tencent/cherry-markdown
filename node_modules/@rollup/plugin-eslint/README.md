[npm]: https://img.shields.io/npm/v/@rollup/plugin-eslint
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-eslint
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-eslint
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-eslint

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-eslint

🍣 A Rollup plugin to lint entry points and all imported files with ESLint.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-eslint --save-dev
# or
yarn add -D @rollup/plugin-eslint
```

## Usage

```js
import eslint from '@rollup/plugin-eslint';

export default {
  input: 'main.js',
  plugins: [
    eslint({
      /* your options */
    })
  ]
};
```

## Options

This plugin takes a configuration object intended for the [ESLint constructor](https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions) with the addition of a `throwOnWarning`, `throwOnError`, `formatter`, `include` and `exclude` prop.

You can also use eslint configuration in the form of a `.eslintrc.*` file in your project's root. It will be loaded automatically.

### exclude

Type: `String | String[]`<br>
Default: `node_modules/**`

A single [`picomatch`](https://github.com/micromatch/picomatch) pattern or an array of patterns controlling which files this plugin should explicitly exclude. Gets forwarded to the [`createFilter`](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter) method of `@rollup/pluginutils`.

### fix

Type: `Boolean`<br>
Default: `false`

If true, will auto fix source code.

### formatter

Type: `Function<String> | Function<Promise<String>> | String`<br>
Default: `stylish`

Custom error formatter, the name of a built-in formatter, or the path to a custom formatter.

### include

Type: `String | String[]`<br>
Default: `[]`

A single [`picomatch`](https://github.com/micromatch/picomatch) pattern or an array of patterns controlling which files this plugin should explicitly include. Gets forwarded to the [`createFilter`](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter) method of `@rollup/pluginutils`.

### throwOnError

Type: `Boolean`<br>
Default: `false`

If true, will throw an error and exit the process when ESLint reports any errors.

### throwOnWarning

Type: `Boolean`<br>
Default: `false`

If true, will throw an error and exit the process when ESLint reports any warnings.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
