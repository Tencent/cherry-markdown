<p align="center">
  <img src="https://yowainwright.imgix.net/gh/es-check.svg" alt="ES Check ✔️" width="120" />
</p>

---

<p align="center">Check JavaScript files ES version against a specified ES version 🏆</p>

---

# ES Check ✔️

[![npm version](https://badge.fury.io/js/es-check.svg)](https://www.npmjs.com/package/es-check)

---

**ES Check** checks JavaScript files against a specified version of ECMAScript (ES) with a shell command. If a specified file's ES version doesn't match the ES version argument passed in the ES Check command, ES Check will throw an error and log the files that didn't match the check.

Ensuring that JavaScript files can pass ES Check is important in a [modular and bundled](https://www.sitepoint.com/javascript-modules-bundling-transpiling/) world. Read more about [why](#why).

---

## Version 7 🎉

Thanks to the efforts of [Anders Kaseorg](https://github.com/andersk), ES Check has switched to [Commander](https://www.npmjs.com/package/commander)! There appears to be no breaking issues but this update is being published as a major release for your ease-of-use. Please reach out with observations or pull requests features/fixes!

This update was made for security purposes—dependencies not being maintained.

Thanks to Anders for this deeper fix, to [Pavel Starosek](https://github.com/StudioMaX) for the initial issue and support, and to [Alexander Pepper](https://github.com/apepper) for digging into this issue more!

---

<p align="center">
  <a href="#get-started">Get Started</a>&nbsp;&nbsp;
  <a href="#why-es-check">Why ES Check?</a>&nbsp;&nbsp;
  <a href="#usage">Usage</a>&nbsp;&nbsp;
  <a href="#walk-through">Walk Through</a>&nbsp;&nbsp;
  <a href="#api">API</a>&nbsp;&nbsp;
  <a href="#debugging">Debugging</a>&nbsp;&nbsp;
  <a href="#contributing">Contributing</a>&nbsp;&nbsp;
  <a href="/issues">Issues</a>
  <a href="#roadmap">Roadmap</a>
</p>

---

## Get Started

Install

```sh

npm i es-check --save-dev   # locally
npm i es-check -g           # or globally

```

Check if an array or glob of files matches a specified ES version.

- **Note:** adds quotation around globs. Globs are patterns like so, `<something>/*.js`.

```sh

es-check es5 './vendor/js/*.js' './dist/**/*.js'

```

- The ES Check script (above) checks `/dist/*.js` files to see if they're ES5. It throws an error and logs files are that do not pass the check.

---

## Why ES Check?

In modern JavaScript builds, files are bundled up so they can be served in an optimized manner in the browsers. It is assumed by developers that future JavaScript—like ES8 will be transpiled (changed from future JavaScript to current JavaScript) appropriately by a tool like Babel. Sometimes there is an issue where files are not transpiled. There was no efficient way to test for files that weren't transpiled—until now. That's what ES Check does.

---

## Walk through

The images below demonstrate command line scripts and their corresponding logged results.

Pass
![pass](https://user-images.githubusercontent.com/1074042/31471487-d7be22ee-ae9d-11e7-86e2-2c0f71cfffe6.jpg)

Fail
![fail](https://user-images.githubusercontent.com/1074042/31471486-d65c3a80-ae9d-11e7-94fd-68b7acdb2d89.jpg)

**ES Check** is run above with node commands. It can also be run within npm scripts, ci tools, or testing suites.

---

## API

**ES Check** provides the necessities. It accepts its place as a JavaScript matcher/tester.

### General Information

```sh

# USAGE

index.js es-check <ecmaVersion> [files...]

```

### Arguments

```sh

<ecmaVersion> 'define the ECMAScript version to check for against a glob of JavaScript files' required
[files...] 'a glob of files to test the ECMAScript version against' required

```

### Options

**Modules Flag**

```sh

--module use ES modules, default false

```

**Allow Hash Bang**

```sh

--allow-hash-bang supports files that start with hash bang, default false

```

**Not**

```sh

--not=target1,target2 An array of file/folder names or globs that you would like to ignore. Defaults to `[]`.

```

**Files**

```sh

--files=target1,target2 An array of file/folder names or globs to test the ECMAScript version against. Alias of [...files] argument.

```

⚠️ **NOTE:** This is primarily intended as a way to override the `files` setting in the `.escheckrc` file for specific invocations. Setting both the `[...files]` argument and `--files` flag is an error.

### Global Options

```sh

-h, --help         Display help
-V, --version      Display version
--no-color         Disable colors
--quiet            Quiet mode - only displays warn and error messages
-v, --verbose      Verbose mode - will also output debug messages

```

---

## Usage

ES Check is a shell command CLI. It is run in [shell tool](http://linuxcommand.org/lc3_learning_the_shell.php) like Terminal, ITerm, or Hyper. It takes in two arguments: an [ECMAScript version](https://www.w3schools.com/js/js_versions.asp) (`<ECMAScript version>`) and files (`[files]`) in [globs](http://searchsecurity.techtarget.com/definition/globbing).

Here are some example of **es check** scripts that could be run:

```sh
# globs
es-check ./js/*.js

# array of arguments
es-check ./js/*.js ./dist/*.js
```

---

## Configuration

If you're using a consistent configuration, you can create a `.escheckrc` file in JSON format with the `ecmaVersion` and `files` arguments so you can conveniently run `es-check` standalone from the command line.

Here's an example of what an `.escheckrc` file will look like:

```json
{
  "ecmaVersion": "es6",
  "module": false,
  "files": "./dist/**/*.js",
  "not": ["./dist/skip/*.js"]
}
```

⚠️ **NOTE:** Using command line arguments while there is an `.escheckrc` file in the project directory will override the configuration values in `.escheckrc`.

## Debugging

As of ES-Check version **2.0.2**, a better debugging interface is provided. When a file errors, An error object will be logged with:

- the erroring file
- the error
- the error stack

⚠️ **NOTE:** Error logs are from the Acorn parser while parsing JavaScript related to specific versions of ECMAScript. This means error messaging is not specific to ECMAScript version. It still offers context into parsing issues!

---

## Acknowledgements

ES Check is a small utility using powerful tools that [Isaac Z. Schlueter](https://github.com/isaacs), [Marijn Haverbeke](https://github.com/marijnh), and [Matthias Etienne](https://github.com/mattallty) built. [ES Checker](https://github.com/ruanyf/es-checker) by [Ruan YiFeng](https://github.com/ruanyf) checks the JavaScript version supported within a [browser](http://ruanyf.github.io/es-checker/) at run time. ES Check offers similar feedback to ES Checker but at build time and is specific to the product that is using it. ES Check was started after reading this [post](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/) about [deploying es2015 code to production today] by [Philip Walton](https://github.com/philipwalton).

---

## Contributing

ES Check has 3 main dependencies: [acorn](https://github.com/ternjs/acorn/), [glob](https://www.npmjs.com/package/glob), and [caporal](https://github.com/mattallty/Caporal.js). To contribute, file an [issue](https://github.com/yowainwright/es-check/issues) or submit a pull request. To setup local development, run `./bin/setup.sh` or open the devcontainer in VSCode.

### Contributors

- [Jeff Wainwright](https://github.com/yowainwright/)
- [Brian Gonzalez](https://github.com/briangonzalez/)
- [Jon Ong](https://github.com/jonathanong/)
- [Suhas Karanth](https://github.com/sudo-suhas)
- [Ben Junya](https://github.com/MrBenJ)
- [Jeff Barczewski](https://github.com/jeffbski)
- [Brandon Casey](https://github.com/BrandonOCasey)

### Roadmap

- Provide compilation step to support esm
  - non-user-facing
  - required to keep package dependencies up-to-date as more dependencies are ESM-only
- Provide checks for _theoretical_ keywork words
  - Things like `Map` and `Object.assign` are not keywords that fail ECMAScript
    compilation depending on specific versions of ECMAScript. However, they hint at additions to ECMAScript that previous version did not support.
  - This feature will enhance an already built-in confiration feature to provide more out-of-the-box support for ECMAScript checking.
  - If enabled, this feature will warn (or fail) based on _theoretical_ ECMAScript keywords.
