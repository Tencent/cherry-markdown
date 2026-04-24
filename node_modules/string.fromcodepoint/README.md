# ES6 `String.fromCodePoint` polyfill [![Build status](https://travis-ci.org/mathiasbynens/String.fromCodePoint.svg?branch=master)](https://travis-ci.org/mathiasbynens/String.fromCodePoint)

An robust & optimized ES3-compatible polyfill for [the `String.fromCodePoint` method in ECMAScript 6](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-string.fromcodepoint).

Other polyfills for `String.fromCodePoint` are available:

* <http://norbertlindenberg.com/2012/05/ecmascript-supplementary-characters/#String> by [Norbert Lindenberg](http://norbertlindenberg.com/) (passes all tests)
* <https://gist.github.com/slevithan/2290602> by [Steven Levithan](http://stevenlevithan.com/) (fails 8 tests)
* <https://github.com/paulmillr/es6-shim/blob/771e98e789292706d2435e4e10ffbe45edf40da6/es6-shim.js#L63-L83> by [Paul Miller](http://paulmillr.com/) (passes all tests)

## Installation

In a browser:

```html
<script src="fromcodepoint.js"></script>
```

Via [npm](http://npmjs.org/):

```bash
npm install string.fromcodepoint
```

Then, in [Node.js](http://nodejs.org/):

```js
require('string.fromcodepoint');

// On Windows and on Mac systems with default settings, case doesn’t matter,
// which allows you to do this instead:
require('String.fromCodePoint');
```

## Notes

[A polyfill + test suite for `String.prototype.codePointAt`](http://mths.be/codepointat) is available, too.

The tests for this repository [are now used by Mozilla](http://hg.mozilla.org/integration/mozilla-inbound/rev/2411714cd058), to help ensure their native `String.fromCodePoint` implementation is correct.

## Author

| [![twitter/mathias](https://gravatar.com/avatar/24e08a9ea84deb17ae121074d0f17125?s=70)](https://twitter.com/mathias "Follow @mathias on Twitter") |
|---|
| [Mathias Bynens](http://mathiasbynens.be/) |

## License

This polyfill is available under the [MIT](http://mths.be/mit) license.
