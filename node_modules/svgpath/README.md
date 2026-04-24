svgpath
=======

[![CI](https://github.com/fontello/svgpath/workflows/CI/badge.svg)](https://github.com/fontello/svgpath/actions)
[![NPM version](https://img.shields.io/npm/v/svgpath.svg?style=flat)](https://www.npmjs.org/package/svgpath)
[![Coverage Status](https://img.shields.io/coveralls/fontello/svgpath/master.svg?style=flat)](https://coveralls.io/r/fontello/svgpath?branch=master)


> Low level toolkit for SVG paths transformations.
Sometimes you can't use `transform` attributes and have to apply changes to svg paths directly.
Then this package is for you :) !

Note: this package works with [path data](https://www.w3.org/TR/SVG11/paths.html#PathData) strings,
not with full svg xml sources.


Install
-------

```bash
npm install svgpath
```


Example
-------

```js
var svgpath = require('svgpath');

var transformed = svgpath(__your_path__)
                    .scale(0.5)
                    .translate(100,200)
                    .rel()
                    .round(1)
                    .toString();
```


API
---

All methods are chainable (return self).


### new SvgPath(path) -> self

Constructor. Creates new `SvgPath` class instance with chainable methods.
`new` can be omited.


### SvgPath.from(path|SvgPath) -> self

Similar to `Array.from()`. Creates `SvgPath` instance from string or another
instance (data will be cloned).


### .abs() -> self

Converts all path commands to absolute.


### .rel() -> self

Converts all path commands to relative. Useful to reduce output size.


### .scale(sx [, sy]) -> self

Rescale path (the same as SVG `scale` transformation). `sy` = `sx` by default.


### .translate(x [, y]) -> self

Rescale path (the same as SVG `translate` transformation). `y` = 0 by default.


### .rotate(angle [, rx, ry]) -> self

Rotate path to `angle` degrees around (rx, ry) point. If rotation center not set,
(0, 0) used. The same as SVG `rotate` transformation.


### .skewX(degrees) -> self

Skew path along the X axis by `degrees` angle.


### .skewY(degrees) -> self

Skew path along the Y axis by `degrees` angle.


### .matrix([ m1, m2, m3, m4, m5, m6 ]) -> self

Apply 2x3 affine transform matrix to path. Params - array. The same as SVG
`matrix` transformation.


### .transform(string) -> self

Any SVG transform or their combination. For example `rotate(90) scale(2,3)`.
The same format, as described in SVG standard for `transform` attribute.


### .unshort() -> self

Converts smooth curves `T`/`t`/`S`/`s` with "missed" control point to
generic curves (`Q`/`q`/`C`/`c`).


### .unarc() -> self

Replaces all arcs with bezier curves.


### .toString() -> string

Returns final path string.


### .round(precision) -> self

Round all coordinates to given decimal precision. By default round to integer.
Useful to reduce resulting output string size.


### .iterate(function(segment, index, x, y) [, keepLazyStack]) -> self

Apply iterator to all path segments.

- Each iterator receives `segment`, `index`, `x` and `y` params.
  Where (x, y) - absolute coordinates of segment start point.
- Iterator can modify current segment directly (return nothing in this case).
- Iterator can return array of new segments to replace current one (`[]` means
  that current segment should be delated).

If second param `keepLazyStack` set to `true`, then iterator will not evaluate
stacked transforms prior to run. That can be useful to optimize calculations.


Support svgpath
---------------

You can support this project via [Tidelift subscription](https://tidelift.com/subscription/pkg/npm-svgpath?utm_source=npm-svgpath&utm_medium=referral&utm_campaign=readme).
