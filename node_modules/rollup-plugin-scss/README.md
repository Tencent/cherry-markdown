# Rollup multiple .scss, .sass and .css imports

<a href="LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="Software License" />
</a>
<a href="https://github.com/thgh/rollup-plugin-scss/issues">
  <img src="https://img.shields.io/github/issues/thgh/rollup-plugin-scss.svg" alt="Issues" />
</a>
<a href="http://standardjs.com/">
  <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" alt="JavaScript Style Guide" />
</a>
<a href="https://npmjs.org/package/rollup-plugin-scss">
  <img src="https://img.shields.io/npm/v/rollup-plugin-scss.svg?style=flat-squar" alt="NPM" />
</a>
<a href="https://github.com/thgh/rollup-plugin-scss/releases">
  <img src="https://img.shields.io/github/release/thgh/rollup-plugin-scss.svg" alt="Latest Version" />
</a>

## Installation

```
npm install --save-dev rollup-plugin-scss sass
```

If any of them is installed, it will be used automatically, if both installed `sass` will be used.

## Usage

```js
// rollup.config.js
import scss from 'rollup-plugin-scss'

export default {
  input: 'input.js',
  output: {
    file: 'output.js',
    format: 'esm',
    // Removes the hash from the asset filename
    assetFileNames: '[name][extname]'
  },
  plugins: [
    scss() // will output compiled styles to output.css
  ]
}

// OR

export default {
  input: 'input.js',
  output: { file: 'output.js', format: 'esm' },
  plugins: [
    scss({ fileName: 'bundle.css' }) // will output compiled styles to "bundle.css"
  ]
}

// OR

export default {
  input: 'input.js',
  output: { file: 'output.js', format: 'esm' },
  plugins: [
    scss() // will output compiled styles to "assets/output-123hash.css"
  ]
}
```

```js
// entry.js
import './reset.scss'
```

### Options

Options are passed to the sass compiler ([node-sass] by default). Refer to [ the Sass docs](https://sass-lang.com/documentation/js-api#options) for more details on these options. <br/>
One notable option is `indentedSyntax` which you'll need if you're parsing Sass syntax instead of Scss syntax. (e.g. when extracting a Vue `<style lang="sass">` tag) <br/>
By default the plugin will base the filename for the css on the bundle destination.

```js
scss({
  // Defaults to output.css, Rollup may add a hash to this!
  name: 'output.css',

  // Literal asset filename, bypasses the automated filenaming transformations
  fileName: 'output.css',

  // Callback that will be called ongenerate with two arguments:
  // - styles: the contents of all style tags combined: 'body { color: green }'
  // - styleNodes: an array of style objects: { filename: 'body { ... }' }
  output: function (styles, styleNodes) {
    writeFileSync('bundle.css', styles)
  },

  // Disable any style output or callbacks, import as string
  output: false,

  // Enables/disables generation of source map (default: false)
  sourceMap: true,

  // Choose files to include in processing (default: ['/**/*.css', '/**/*.scss', '/**/*.sass'])
  include: [],

  // Choose files to exclude from processing (default: undefined)
  exclude: [],

  // Determine if node process should be terminated on error (default: false)
  failOnError: true,

  // Prefix global scss. Useful for variables and mixins.
  prefix: `@import "./fonts.scss";`,

  // A Sass (sass compatible) compiler to use
  // - sass and node-sass packages are picked up automatically
  // - you can use this option to specify custom package (e.g. a fork of one of them)
  sass: require('node-sass'),

  // Run postcss processor before output
  processor: () => postcss([autoprefixer({ overrideBrowserslist: 'Edge 18' })]),

  // Process resulting CSS
  processor: (css, map) => ({
    css: css.replace('/*date*/', '/* ' + new Date().toJSON() + ' */'),
    map
  }),

  // or, just string (for backward compatiblity with v2 or simplicity)
  processor: css =>
    css.replace('/*date*/', '/* ' + new Date().toJSON() + ' */'),

  // Log filename and size of generated CSS files (default: true)
  verbose: true

  // Add file/folder to be monitored in watch mode so that changes to these files will trigger rebuilds.
  // Do not choose a directory where rollup output or dest is pointed to as this will cause an infinite loop
  watch: 'src/styles/components',
  watch: ['src/styles/components', 'src/multiple/folders']

  // Any other options are passed to the sass compiler
  includePaths: ...
})
```

## Examples

Using postcss + autoprefixer + includePaths (sass option)

```js
import scss from 'rollup-plugin-scss'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'

export default {
  input: 'input.js',
  output: {
    file: 'output.js',
    format: 'esm'
  },
  plugins: [
    scss({
      processor: () => postcss([autoprefixer()]),
      includePaths: [
        path.join(__dirname, '../../node_modules/'),
        'node_modules/'
      ]
    })
  ]
}
```

Minify CSS output:

```js
scss({
  outputStyle: 'compressed'
})
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Contributing

Contributions and feedback are very welcome. New features should include a test.

To get it running:

1. Clone the project.
2. `npm install`

## Credits

- [Thomas Ghysels](https://github.com/thgh)
- [All Contributors][link-contributors]

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

[link-author]: https://github.com/thgh
[link-contributors]: ../../contributors
[rollup-plugin-vue]: https://www.npmjs.com/package/rollup-plugin-vue
[rollup-plugin-buble]: https://www.npmjs.com/package/rollup-plugin-buble
[rollup-plugin-babel]: https://www.npmjs.com/package/rollup-plugin-babel
[node-sass]: https://www.npmjs.com/package/node-sass
[sass]: https://www.npmjs.com/package/sass
