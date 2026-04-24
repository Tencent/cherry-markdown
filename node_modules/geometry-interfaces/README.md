Geometry Interfaces
===================

The W3C [Geometry](http://www.w3.org/TR/cssom-view/#geometry)
[Interfaces](http://www.w3.org/TR/geometry-1/) implemented in JavaScript and
polyfilled.

[![geometry-interfaces on NPM](https://nodei.co/npm/geometry-interfaces.png)](https://www.npmjs.com/package/geometry-interfaces)

In the box so far
-----------------

### Interfaces

#### Work in progress

- [DOMMatrixReadOnly](https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrixReadOnly)
- [DOMMatrix](https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix)

#### Up next

- [DOMPointReadOnly](https://developer.mozilla.org/en-US/docs/Web/API/DOMPointReadOnly)
- [DOMPoint](https://developer.mozilla.org/en-US/docs/Web/API/DOMPoint)

#### Under consideration

- [DOMRectReadOnly](https://developer.mozilla.org/en-US/docs/Web/API/DOMRectReadOnly)
- [DOMRect](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect)

Usage
-----

If you're using a module system, just import the library after installing it [from NPM](https://www.npmjs.com/package/geometry-interfaces):

```js
import 'geometry-interfaces' // ES2015 Modules
// or
require('geometry-interfaces') // CommonJS
// or
define(['geometry-interfaces'], () => {}) // AMD
```

You can also clone this repo, then you'll see a `global.js` file in the root of
the project that you can copy over to your project and load with a `<script>`
tag, for example:

```html
<script src='global.js'></script>
```

(You can rename the file of course.)

The `global.js` file is usually the one shipped with the last tagged version.
Execute `npm run build-global` to update the file using the latest content in
the repo.

If you don't want to polyfill everything and you're using a module system (f.e.
Rollup, Webpack, Browserify, etc), import whatever you need directly:

```js
import DOMMatrix from 'geometry-interfaces/DOMMatrix'
```

Contributing
------------

Disclaimer: I'm implementing these interfaces/APIs on an as-needed basis, so
this project may not currently include *all* of the interfaces or APIs.

Consider bringing the web forward by making a pull request to add missing
interfaces, APIs, or performance improvements (especially on the matrix
calculations). :]

Miscellaneous
-------------

The word "dommetry" is a play on the words "geometry" and "DOMMatrix" put
together. :D
