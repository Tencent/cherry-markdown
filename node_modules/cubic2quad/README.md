cubic2quad
==========

[![CI](https://github.com/fontello/cubic2quad/actions/workflows/ci.yml/badge.svg)](https://github.com/fontello/cubic2quad/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/cubic2quad.svg?style=flat)](https://www.npmjs.org/package/cubic2quad)
[![Coverage Status](https://img.shields.io/coveralls/fontello/cubic2quad/master.svg?style=flat)](https://coveralls.io/r/fontello/cubic2quad?branch=master)

> Aproximates cubic Bezier curves with quadratic ones.

This package was done to create TTF fonts (those support quadratic curves only).
Generated curves have the same tangents angles at the ends. That's important to
keep result visually smooth.


Algorithm
---------

Logic is similar to one from [FontForge](https://fontforge.github.io/bezier.html).

Steps:

1. Split quadratic curve into _k_ segments (from 2 at start, to 8 max).
2. Approximate each segment with tangents intersection approach (see
   [picture](http://www.timotheegroleau.com/Flash/articles/cubic_bezier/quadratic_on_cubic_1.gif) in [article](http://www.timotheegroleau.com/Flash/articles/cubic_bezier_in_flash.htm)).
3. Measure approximation error and increase splits count if needed (and max not reached).
   - set 10 points on each interval & calculate minimal distance to created
     quadratic curve.

Usage
-----

```js
var cubic2quad = require('cubic2quad');
// Input: (px1, py1, cx1, cy1, cx2, cy2, px2, py2, precision)
var quads = cubic2quad(0, 0, 10, 9, 20, 11, 30, 0, 0.1);
```

It converts given quadratic curve to a number of quadratic ones. Result is:

    [ P1x, P1y, C1x, C1y, P2x, P2y, C2x, C2y, ..., Cnx, Cny, P{n+1}x, P{n+1}y ]

where _Pi_ are base points and _Ci_ are control points.


Authors
-------

- Alexander Rodin - [@a-rodin](https://github.com/a-rodin)
- Vitaly Puzrin - [@puzrin](https://github.com/puzrin)


License
-------

[MIT](https://github.com/fontello/cubic2quad/blob/master/LICENSE)
